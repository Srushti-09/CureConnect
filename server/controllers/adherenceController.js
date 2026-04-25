const AdherenceLog = require('../models/AdherenceLog');
const Prescription = require('../models/Prescription');
const mongoose = require('mongoose');

// Mark adherence for a medicine
exports.markAdherence = async (req, res) => {
  const { prescriptionId, medicineName, status, date } = req.body;
  const patientId = req.user._id;

  try {
    const log = await AdherenceLog.create({
      patientId,
      prescriptionId,
      medicineName,
      status,
      date: date || new Date()
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get adherence logs for a patient
exports.getAdherenceLogs = async (req, res) => {
  const patientId = req.params.patientId || req.user._id;

  try {
    const logs = await AdherenceLog.find({ patientId }).sort({ date: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate compliance score for a patient
exports.getComplianceScore = async (req, res) => {
  const patientId = req.params.patientId || req.user._id;

  try {
    // Basic compliance calculation: (Taken / Total scheduled in last 30 days)
    // For simplicity in this demo, we'll look at the total logs
    const totalLogs = await AdherenceLog.countDocuments({ patientId });
    const takenLogs = await AdherenceLog.countDocuments({ patientId, status: 'Taken' });

    const score = totalLogs === 0 ? 100 : Math.round((takenLogs / totalLogs) * 100);

    let status = 'Critical';
    if (score >= 90) status = 'Excellent';
    else if (score >= 75) status = 'Good';
    else if (score >= 50) status = 'Poor';

    res.json({ score, status, total: totalLogs, taken: takenLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
