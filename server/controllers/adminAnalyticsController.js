const AdherenceLog = require('../models/AdherenceLog');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Non-adherent patients (Score below 50%)
    // This is a heavy query, in a real app we'd pre-calculate this
    const allPatients = await User.find({ role: 'patient' });
    const nonAdherentPatients = [];

    for (const patient of allPatients) {
      const total = await AdherenceLog.countDocuments({ patientId: patient._id });
      if (total > 0) {
        const taken = await AdherenceLog.countDocuments({ patientId: patient._id, status: 'Taken' });
        const score = (taken / total) * 100;
        if (score < 50) {
          nonAdherentPatients.push({
            id: patient._id,
            name: patient.name,
            score: Math.round(score)
          });
        }
      }
    }

    // 2. Missed doses trend (Last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const missedCount = await AdherenceLog.countDocuments({
        status: 'Missed',
        date: { $gte: date, $lt: nextDate }
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count: missedCount
      });
    }

    // 3. (Mock) Top risky drug combinations detected
    // In a real app, we'd log when interactions are found
    const riskyCombinations = [
      { drugs: 'Paracetamol + Alcohol', risk: 'High', detections: 12 },
      { drugs: 'Aspirin + Warfarin', risk: 'Severe', detections: 8 },
      { drugs: 'Ibuprofen + Methotrexate', risk: 'Moderate', detections: 5 }
    ];

    res.json({
      nonAdherentPatients,
      missedDosesTrend: last7Days,
      riskyCombinations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
