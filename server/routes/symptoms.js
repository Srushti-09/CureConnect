const express = require('express');
const Symptom = require('../models/Symptom');
const TriageRule = require('../models/TriageRule');
const { protect } = require('../middleware/auth');
const router = express.Router();

// ─────────────────────────────────────────────────────────
// POST /api/symptoms — Log daily symptoms (Patient)
// ─────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { symptoms, severity, notes } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ message: 'At least one symptom is required' });
    }

    const log = await Symptom.create({
      patient: req.user._id,
      symptoms: symptoms.map(s => s.toLowerCase().trim()),
      severity: Math.min(5, Math.max(1, severity || 1)),
      notes: notes || '',
      date: new Date(),
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// Built-in Triage Rules (fallback when DB collection is empty)
// ─────────────────────────────────────────────────────────
const FALLBACK_TRIAGE_RULES = [
  { symptomKeyword: 'chest pain',     priority: 'Red',    score: 10, specialistType: 'Cardiologist',          urgencyEstimate: 'Immediate (ER)' },
  { symptomKeyword: 'breathlessness', priority: 'Red',    score: 9,  specialistType: 'Pulmonologist',         urgencyEstimate: 'Immediate (ER)' },
  { symptomKeyword: 'numbness',       priority: 'Red',    score: 8,  specialistType: 'Neurologist',           urgencyEstimate: 'Within 1 hour' },
  { symptomKeyword: 'fever',          priority: 'Yellow', score: 5,  specialistType: 'General Physician',     urgencyEstimate: 'Within 24 hours' },
  { symptomKeyword: 'nausea',         priority: 'Yellow', score: 4,  specialistType: 'Gastroenterologist',    urgencyEstimate: 'Within 24 hours' },
  { symptomKeyword: 'dizziness',      priority: 'Yellow', score: 5,  specialistType: 'Neurologist',           urgencyEstimate: 'Within 12 hours' },
  { symptomKeyword: 'cough',          priority: 'Green',  score: 3,  specialistType: 'General Physician',     urgencyEstimate: 'Within 3-5 days' },
  { symptomKeyword: 'headache',       priority: 'Yellow', score: 4,  specialistType: 'Neurologist',           urgencyEstimate: 'Within 24 hours' },
];

// ─────────────────────────────────────────────────────────
// POST /api/symptoms/triage — Smart Triage Engine
// ─────────────────────────────────────────────────────────
router.post('/triage', protect, async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || symptoms.length === 0) return res.status(400).json({ message: 'No symptoms provided' });

    // Pull rules from MongoDB first; if collection is empty, use built-in fallback
    let rules = await TriageRule.find({});
    if (!rules || rules.length === 0) {
      rules = FALLBACK_TRIAGE_RULES;
    }

    let totalScore = 0;
    let highestSeverityRule = null;

    symptoms.forEach(sym => {
      const lower = sym.toLowerCase();
      rules.forEach(rule => {
        if (lower.includes(rule.symptomKeyword.toLowerCase())) {
          totalScore += rule.score;
          if (!highestSeverityRule || rule.score > highestSeverityRule.score) {
            highestSeverityRule = rule;
          }
        }
      });
    });

    if (!highestSeverityRule) {
      return res.json({ priority: 'Green', score: totalScore, specialistType: 'General Physician', urgency: 'Within 3-5 days' });
    }

    const priority = totalScore >= 10 ? 'Red' : highestSeverityRule.priority;
    const urgency = priority === 'Red' ? 'Immediate (ER)' : highestSeverityRule.urgencyEstimate;

    res.json({
      priority,
      score: totalScore,
      specialistType: highestSeverityRule.specialistType,
      urgency,
      triggeredBy: highestSeverityRule.symptomKeyword
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/symptoms/triage/rules — View Smart Triage Matrix (Doctor)
// ─────────────────────────────────────────────────────────
router.get('/triage/rules', protect, async (req, res) => {
  try {
    let rules = await TriageRule.find({}).sort({ score: -1 });
    if (!rules || rules.length === 0) {
      rules = [...FALLBACK_TRIAGE_RULES].sort((a, b) => b.score - a.score);
    }
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/symptoms — Get symptom history (Patient)
// Returns the logged-in patient's last 30 days of logs.
// ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await Symptom.find({
      patient: req.user._id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/symptoms/cascade-alerts — Cascade Detection (Doctor)
//
// ⭐ MONGODB AGGREGATION PIPELINE ⭐
// This is the core of the feature. It uses a time-windowed
// aggregation pipeline to detect symptom cascades:
//
// Stage 1: $match    — Filter to last 3 days
// Stage 2: $sort     — Chronological order
// Stage 3: $group    — Group by patient, collect daily logs
// Stage 4: $match    — Only patients with 2+ days of data
// Stage 5: $lookup   — Join with User collection for names
// Stage 6: $unwind   — Flatten the joined array
// Stage 7: $project  — Shape the final output
//
// Post-processing detects escalation patterns:
//   - New symptoms appearing day-over-day
//   - Severity increasing across entries
// ─────────────────────────────────────────────────────────
router.get('/cascade-alerts', protect, async (req, res) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // ── MongoDB Aggregation Pipeline ──
    const pipeline = [
      // Stage 1: Time-window filter (last 3 days)
      { $match: { date: { $gte: threeDaysAgo } } },

      // Stage 2: Sort chronologically for pattern detection
      { $sort: { date: 1 } },

      // Stage 3: Group by patient — collect all their daily logs
      {
        $group: {
          _id: '$patient',
          logs: {
            $push: {
              symptoms: '$symptoms',
              severity: '$severity',
              date: '$date',
              notes: '$notes',
            },
          },
          totalEntries: { $sum: 1 },
          avgSeverity: { $avg: '$severity' },
          maxSeverity: { $max: '$severity' },
        },
      },

      // Stage 4: Only patients with 2+ entries (need history to detect cascade)
      { $match: { totalEntries: { $gte: 2 } } },

      // Stage 5: Join with Users collection to get patient info
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'patientInfo',
        },
      },

      // Stage 6: Flatten the lookup array
      { $unwind: '$patientInfo' },

      // Stage 7: Shape the output
      {
        $project: {
          patientId: '$_id',
          patientName: '$patientInfo.name',
          patientEmail: '$patientInfo.email',
          logs: 1,
          totalEntries: 1,
          avgSeverity: { $round: ['$avgSeverity', 1] },
          maxSeverity: 1,
        },
      },
    ];

    const results = await Symptom.aggregate(pipeline);

    // ── Post-Processing: Detect Cascade Patterns ──
    const alerts = results
      .map((patient) => {
        const logs = patient.logs;
        let newSymptomsDetected = [];
        let severityEscalating = false;
        let cascadeScore = 0;

        for (let i = 1; i < logs.length; i++) {
          const prev = logs[i - 1];
          const curr = logs[i];

          // Check for NEW symptoms that weren't in the previous entry
          const newSymptoms = curr.symptoms.filter(
            (s) => !prev.symptoms.includes(s)
          );
          if (newSymptoms.length > 0) {
            newSymptomsDetected.push(...newSymptoms);
            cascadeScore += newSymptoms.length * 2;
          }

          // Check for severity escalation
          if (curr.severity > prev.severity) {
            severityEscalating = true;
            cascadeScore += (curr.severity - prev.severity) * 3;
          }
        }

        // Collect all unique symptoms across the window
        const allSymptoms = [...new Set(logs.flatMap((l) => l.symptoms))];

        return {
          ...patient,
          allSymptoms,
          newSymptomsDetected: [...new Set(newSymptomsDetected)],
          severityEscalating,
          cascadeScore,
          isCascade: cascadeScore >= 3, // Threshold for triggering alert
        };
      })
      .filter((a) => a.isCascade) // Only return actual cascades
      .sort((a, b) => b.cascadeScore - a.cascadeScore); // Most severe first

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
