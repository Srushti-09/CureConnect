const AdherenceLog = require('../models/AdherenceLog');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

// Mark medication as taken
const markAdherence = async (req, res) => {
  try {
    const { prescriptionId, medicationName, status, notes, takenAt } = req.body;
    const patientId = req.user._id;

    // Verify prescription exists
    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      patientId: patientId,
      status: 'active'
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or not active' });
    }

    const medication = prescription.medications.find(med =>
      med.name.toLowerCase() === medicationName.toLowerCase()
    );

    if (!medication) {
      return res.status(400).json({ message: 'Medication not found in prescription' });
    }

    const adherenceLog = await AdherenceLog.create({
      patientId: patientId,
      prescriptionId: prescriptionId,
      medication: {
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency
      },
      scheduledTime: takenAt ? new Date(takenAt) : new Date(),
      takenAt: status === 'taken' || status === 'late' ? new Date() : null,
      status: status.toLowerCase(),
      notes: notes || ''
    });

    await updatePrescriptionAdherence(prescriptionId);
    res.status(201).json(adherenceLog);
  } catch (error) {
    console.error('Error marking adherence:', error);
    res.status(500).json({ message: 'Server error marking adherence' });
  }
};

// Get adherence logs
const getAdherenceLogs = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user._id;
    const { prescriptionId, startDate, endDate, limit = 100 } = req.query;

    let query = { patientId };
    if (prescriptionId) query.prescriptionId = prescriptionId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdherenceLog.find(query)
      .populate('prescriptionId', 'diagnosis medications')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error('Error fetching adherence logs:', error);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
};

// Get compliance score
const getComplianceScore = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user._id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = { patientId, createdAt: { $gte: startDate } };
    const totalLogs = await AdherenceLog.countDocuments(query);
    const takenLogs = await AdherenceLog.countDocuments({ ...query, status: { $in: ['taken', 'late'] } });

    const score = totalLogs === 0 ? 100 : Math.round((takenLogs / totalLogs) * 100);

    let status = 'Critical';
    if (score >= 90) status = 'Excellent';
    else if (score >= 75) status = 'Good';
    else if (score >= 50) status = 'Poor';

    res.json({ score, status, total: totalLogs, taken: takenLogs, period: `${days} days` });
  } catch (error) {
    console.error('Error calculating compliance score:', error);
    res.status(500).json({ message: 'Server error calculating score' });
  }
};

const updatePrescriptionAdherence = async (prescriptionId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await AdherenceLog.find({ prescriptionId, createdAt: { $gte: thirtyDaysAgo } });
    const totalLogs = logs.length;
    const takenLogs = logs.filter(log => log.status === 'taken' || log.status === 'late').length;
    const score = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;
    await Prescription.findByIdAndUpdate(prescriptionId, { adherenceScore: score, lastAdherenceUpdate: new Date() });
  } catch (error) {
    console.error('Error updating prescription adherence:', error);
  }
};

module.exports = {
  markAdherence,
  getAdherenceLogs,
  getComplianceScore,
  updatePrescriptionAdherence
};
