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

// ─────────────────────────────────────────────────────────
// POST /api/symptoms/insights — AI Daily Insights
// After logging today's symptoms, get home remedies,
// exercises, and medical suggestions from Gemini AI.
// ─────────────────────────────────────────────────────────
router.post('/insights', protect, async (req, res) => {
  try {
    const { symptoms, severity } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ message: 'At least one symptom is required' });
    }

    const severityLabel = ['', 'Mild', 'Low', 'Moderate', 'High', 'Severe'][severity || 1];

    const prompt = `You are a certified health advisor AI. A patient has just logged these symptoms: ${symptoms.join(', ')} with severity level ${severity}/5 (${severityLabel}).

Provide EXACTLY this JSON structure (no markdown, no code blocks, pure JSON):
{
  "homeRemedies": [
    { "title": "short title", "description": "1-2 sentence home remedy", "icon": "emoji" },
    { "title": "short title", "description": "1-2 sentence home remedy", "icon": "emoji" },
    { "title": "short title", "description": "1-2 sentence home remedy", "icon": "emoji" }
  ],
  "exercises": [
    { "title": "exercise name", "description": "1-2 sentences on how to do it and benefits", "duration": "X mins", "icon": "emoji" },
    { "title": "exercise name", "description": "1-2 sentences on how to do it and benefits", "duration": "X mins", "icon": "emoji" }
  ],
  "medicalSuggestion": {
    "title": "medical advice title",
    "description": "2-3 sentence professional medical suggestion",
    "urgency": "low|medium|high",
    "specialist": "type of doctor to see if needed"
  },
  "dailyTip": "One encouraging wellness tip for the day"
}

Be practical, specific, and empathetic. Home remedies should be easily doable at home. Exercises should be gentle and appropriate for someone experiencing these symptoms. The medical suggestion should be honest about when to see a doctor.`;

    let insights;

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Strip markdown code fences if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleaned);
    } catch (aiErr) {
      console.error('Gemini AI error, using fallback:', aiErr.message);
      // Intelligent fallback based on symptoms
      insights = generateFallbackInsights(symptoms, severity);
    }

    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/symptoms/weekly-analysis — AI Weekly Analysis
// Analyzes 5-7 days of symptom data to provide a
// comprehensive health assessment and recommendations.
// ─────────────────────────────────────────────────────────
router.get('/weekly-analysis', protect, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await Symptom.find({
      patient: req.user._id,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

    if (logs.length < 3) {
      return res.json({
        hasEnoughData: false,
        daysLogged: logs.length,
        daysNeeded: 3,
        message: `Keep logging! You need at least 3 days of data for a weekly analysis. You have ${logs.length} day(s) so far.`
      });
    }

    // Build the data summary for AI
    const logSummary = logs.map((l, i) => {
      const d = new Date(l.date);
      return `Day ${i + 1} (${d.toLocaleDateString()}): Symptoms=[${l.symptoms.join(', ')}], Severity=${l.severity}/5${l.notes ? `, Notes: ${l.notes}` : ''}`;
    }).join('\n');

    const allSymptoms = [...new Set(logs.flatMap(l => l.symptoms))];
    const avgSeverity = (logs.reduce((sum, l) => sum + l.severity, 0) / logs.length).toFixed(1);
    const maxSeverity = Math.max(...logs.map(l => l.severity));
    const severityTrend = logs.length >= 2
      ? (logs[logs.length - 1].severity > logs[0].severity ? 'increasing' : logs[logs.length - 1].severity < logs[0].severity ? 'decreasing' : 'stable')
      : 'stable';

    const prompt = `You are a certified health advisor AI analyzing a patient's weekly symptom data.

DATA SUMMARY (${logs.length} days logged in the past 7 days):
${logSummary}

STATS:
- All unique symptoms: ${allSymptoms.join(', ')}
- Average severity: ${avgSeverity}/5
- Max severity: ${maxSeverity}/5
- Severity trend: ${severityTrend}
- Days logged: ${logs.length}/7

Provide EXACTLY this JSON structure (no markdown, no code blocks, pure JSON):
{
  "overallStatus": "good|caution|concern",
  "statusTitle": "Short status headline",
  "statusDescription": "2-3 sentence summary of overall health pattern this week",
  "shouldSeeDoctor": true/false,
  "doctorUrgency": "none|routine|soon|urgent",
  "patterns": [
    { "observation": "what you noticed", "interpretation": "what it might mean" }
  ],
  "recommendations": [
    { "type": "yoga|exercise|diet|lifestyle|medical", "title": "recommendation title", "description": "2-3 sentence actionable recommendation", "icon": "emoji" }
  ],
  "weeklyExercisePlan": {
    "title": "Recommended routine",
    "activities": [
      { "name": "activity name", "frequency": "how often", "duration": "how long", "benefit": "why it helps" }
    ]
  },
  "encouragement": "A warm, encouraging message to keep tracking and staying healthy"
}

Be honest but compassionate. If symptoms are mild and stable, reassure them. If there's an escalating or concerning pattern, clearly advise seeing a doctor. Provide practical yoga/exercise recommendations.`;

    let analysis;

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (aiErr) {
      console.error('Gemini AI error, using fallback:', aiErr.message);
      analysis = generateFallbackWeeklyAnalysis(logs, allSymptoms, avgSeverity, maxSeverity, severityTrend);
    }

    res.json({
      hasEnoughData: true,
      daysLogged: logs.length,
      ...analysis,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────
// Fallback insight generators (when Gemini is unavailable)
// ─────────────────────────────────────────────────────────
function generateFallbackInsights(symptoms, severity) {
  const remedyMap = {
    headache: [
      { title: 'Cold Compress', description: 'Apply a cold pack to your forehead for 15 minutes. It constricts blood vessels and reduces pain.', icon: '🧊' },
      { title: 'Ginger Tea', description: 'Brew fresh ginger in hot water. Ginger has anti-inflammatory properties that help relieve headaches.', icon: '🍵' },
      { title: 'Peppermint Oil', description: 'Apply diluted peppermint oil on temples. Menthol helps relax muscles and ease pain.', icon: '🌿' },
    ],
    fatigue: [
      { title: 'Power Nap', description: 'Take a 20-minute nap. Short naps restore alertness without grogginess.', icon: '😴' },
      { title: 'Iron-Rich Snack', description: 'Eat spinach, nuts, or dark chocolate. Iron deficiency is a common cause of fatigue.', icon: '🥗' },
      { title: 'Hydration Boost', description: 'Drink 2 glasses of water with lemon. Dehydration is a leading cause of tiredness.', icon: '💧' },
    ],
    nausea: [
      { title: 'Ginger Chew', description: 'Chew on a small piece of fresh ginger or have ginger candy to settle your stomach.', icon: '🫚' },
      { title: 'Peppermint Aroma', description: 'Inhale peppermint essential oil. It relaxes stomach muscles and reduces nausea.', icon: '🌱' },
      { title: 'Small Sips', description: 'Take small sips of clear, cold water or ice chips every 10 minutes.', icon: '🧊' },
    ],
    fever: [
      { title: 'Stay Hydrated', description: 'Drink plenty of fluids — water, herbal tea, broth. Fever increases fluid loss.', icon: '💧' },
      { title: 'Cool Cloth', description: 'Place a cool, damp washcloth on your forehead and wrists to bring temperature down.', icon: '🧣' },
      { title: 'Rest Completely', description: 'Your body fights infections during rest. Stay in bed and sleep when possible.', icon: '🛏️' },
    ],
    anxiety: [
      { title: '4-7-8 Breathing', description: 'Inhale for 4 seconds, hold for 7, exhale for 8. This activates your parasympathetic nervous system.', icon: '🌬️' },
      { title: 'Warm Bath', description: 'Take a warm bath with lavender. Heat relaxes muscles and lavender calms the mind.', icon: '🛁' },
      { title: 'Chamomile Tea', description: 'Drink chamomile tea. It contains apigenin which binds to brain receptors that reduce anxiety.', icon: '🍵' },
    ],
    default: [
      { title: 'Rest & Recover', description: 'Give your body time to heal. Adequate rest is the foundation of recovery.', icon: '🛏️' },
      { title: 'Stay Hydrated', description: 'Drink 8-10 glasses of water throughout the day. Hydration aids all body functions.', icon: '💧' },
      { title: 'Warm Compress', description: 'Apply a warm towel to affected areas. Heat improves circulation and reduces discomfort.', icon: '🧣' },
    ],
  };

  const exerciseMap = {
    headache: [
      { title: 'Neck Stretches', description: 'Gently tilt your head side to side and roll your neck. Releases tension that causes headaches.', duration: '5 mins', icon: '🧘' },
      { title: 'Eye Relaxation', description: 'Close your eyes, palming them with warm hands. Then look at distant objects. Reduces eye strain headaches.', duration: '3 mins', icon: '👁️' },
    ],
    fatigue: [
      { title: 'Brisk Walking', description: 'A short walk outdoors boosts endorphins and increases oxygen flow to your brain.', duration: '10 mins', icon: '🚶' },
      { title: 'Stretching Routine', description: 'Full body stretches to improve blood circulation and shake off sluggishness.', duration: '7 mins', icon: '🤸' },
    ],
    anxiety: [
      { title: 'Yoga — Child\'s Pose', description: 'Kneel and fold forward with arms extended. This calming pose activates the rest-and-digest system.', duration: '5 mins', icon: '🧘' },
      { title: 'Progressive Muscle Relaxation', description: 'Tense and release each muscle group from toes to head. Proven to reduce anxiety by 40%.', duration: '10 mins', icon: '💆' },
    ],
    default: [
      { title: 'Gentle Yoga', description: 'Simple poses like cat-cow and child\'s pose. Gentle movement improves circulation and mood.', duration: '10 mins', icon: '🧘' },
      { title: 'Deep Breathing', description: 'Slow diaphragmatic breathing. 5 seconds in, 5 seconds out. Calms the nervous system.', duration: '5 mins', icon: '🌬️' },
    ],
  };

  // Pick the best matching remedies
  const matchedSymptom = symptoms.find(s => remedyMap[s]) || 'default';
  const homeRemedies = remedyMap[matchedSymptom] || remedyMap.default;
  const exercises = exerciseMap[matchedSymptom] || exerciseMap.default;

  const urgency = severity >= 4 ? 'high' : severity >= 3 ? 'medium' : 'low';
  const specialist = severity >= 4 ? 'General Physician' : 'Not needed at this time';

  return {
    homeRemedies,
    exercises,
    medicalSuggestion: {
      title: severity >= 4
        ? 'Consider Seeing a Doctor'
        : severity >= 3
          ? 'Monitor Your Symptoms'
          : 'Self-Care Should Help',
      description: severity >= 4
        ? `With a severity of ${severity}/5, it's advisable to consult a doctor if symptoms persist beyond 24-48 hours. Keep track of any changes.`
        : severity >= 3
          ? `Your symptoms are moderate. Continue home remedies and monitor. If they worsen or new symptoms appear, schedule a doctor visit.`
          : `Your symptoms are mild. Home remedies and rest should help. Stay hydrated and get adequate sleep.`,
      urgency,
      specialist,
    },
    dailyTip: severity >= 4
      ? '🩺 Listen to your body. Don\'t push through severe symptoms — rest is productive too.'
      : '🌟 You\'re doing great by tracking your health! Small daily steps lead to big wellness gains.',
  };
}

function generateFallbackWeeklyAnalysis(logs, allSymptoms, avgSeverity, maxSeverity, severityTrend) {
  const isConcerning = parseFloat(avgSeverity) >= 3.5 || maxSeverity >= 5 || severityTrend === 'increasing';
  const isCaution = parseFloat(avgSeverity) >= 2.5 || maxSeverity >= 4;

  return {
    overallStatus: isConcerning ? 'concern' : isCaution ? 'caution' : 'good',
    statusTitle: isConcerning
      ? 'Symptoms Need Attention'
      : isCaution
        ? 'Keep Monitoring'
        : 'Looking Good!',
    statusDescription: isConcerning
      ? `Your symptoms have been ${severityTrend} over the past week with an average severity of ${avgSeverity}/5. This pattern suggests you should consult a healthcare professional.`
      : isCaution
        ? `You've had some fluctuating symptoms this week (avg ${avgSeverity}/5). Continue monitoring and apply self-care measures.`
        : `Your symptoms have been mild and manageable this week (avg ${avgSeverity}/5). Keep up the good self-care habits!`,
    shouldSeeDoctor: isConcerning,
    doctorUrgency: isConcerning ? 'soon' : isCaution ? 'routine' : 'none',
    patterns: [
      {
        observation: `${allSymptoms.length} unique symptoms tracked over ${logs.length} days`,
        interpretation: allSymptoms.length > 4
          ? 'Multiple symptoms may indicate your body is fighting something. Ensure adequate rest.'
          : 'A focused set of symptoms is easier to manage with targeted remedies.'
      },
      {
        observation: `Severity trend is ${severityTrend}`,
        interpretation: severityTrend === 'increasing'
          ? 'Rising severity needs attention. Consider professional medical advice.'
          : severityTrend === 'decreasing'
            ? 'Great news! Your symptoms appear to be improving.'
            : 'Stable symptoms can usually be managed with consistent self-care.'
      },
    ],
    recommendations: [
      { type: 'yoga', title: 'Morning Yoga Flow', description: 'Start your day with 15 minutes of gentle yoga. Focus on breathing and body awareness. This helps reduce inflammation and improves mood.', icon: '🧘' },
      { type: 'diet', title: 'Anti-Inflammatory Diet', description: 'Include turmeric, ginger, berries, and leafy greens in your meals. These foods naturally reduce inflammation and support healing.', icon: '🥗' },
      { type: 'lifestyle', title: 'Sleep Hygiene', description: 'Aim for 7-8 hours of sleep. Avoid screens 1 hour before bed. Good sleep is essential for recovery and immune function.', icon: '🌙' },
      ...(isConcerning ? [{ type: 'medical', title: 'Schedule a Check-up', description: 'Given the severity pattern this week, it would be wise to book an appointment with a general physician for a thorough evaluation.', icon: '🩺' }] : []),
    ],
    weeklyExercisePlan: {
      title: 'Gentle Recovery Routine',
      activities: [
        { name: 'Morning Stretches', frequency: 'Daily', duration: '10 mins', benefit: 'Improves flexibility and blood circulation' },
        { name: 'Walking', frequency: '4-5 times/week', duration: '20 mins', benefit: 'Boosts mood and cardiovascular health' },
        { name: 'Yoga/Meditation', frequency: '3-4 times/week', duration: '15 mins', benefit: 'Reduces stress and inflammation' },
        { name: 'Deep Breathing', frequency: 'Daily', duration: '5 mins', benefit: 'Activates parasympathetic nervous system' },
      ],
    },
    encouragement: '💚 You\'re taking charge of your health by tracking consistently. Every day you log is a step toward better understanding your body. Keep it up!',
  };
}

module.exports = router;
