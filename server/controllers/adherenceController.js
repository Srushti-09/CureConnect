const AdherenceLog = require('../models/AdherenceLog');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

// Mark medication as taken
const markAdherence = async (req, res) => {
  try {
    const { prescriptionId, medicationName, status, notes, takenAt } = req.body;
    const patientId = req.user._id;

    // Verify prescription belongs to patient
    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      patient: patientId,
      status: 'active'
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or not active' });
    }

    // Find the medication in prescription
    const medication = prescription.medications.find(med =>
      med.name.toLowerCase() === medicationName.toLowerCase()
    );

    if (!medication) {
      return res.status(400).json({ message: 'Medication not found in prescription' });
    }

    // Create adherence log
    const adherenceLog = await AdherenceLog.create({
      patient: patientId,
      prescription: prescriptionId,
      medication: {
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency
      },
      scheduledTime: takenAt ? new Date(takenAt) : new Date(),
      takenAt: status === 'taken' || status === 'late' ? new Date() : null,
      status,
      notes: notes || ''
    });

    // Update prescription adherence score
    await updatePrescriptionAdherence(prescriptionId);

    res.status(201).json(adherenceLog);

  } catch (error) {
    console.error('Error marking adherence:', error);
    res.status(500).json({ message: 'Server error marking adherence' });
  }
};

// Get adherence logs for patient
const getAdherenceLogs = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { prescriptionId, startDate, endDate, limit = 100 } = req.query;

    let query = { patient: patientId };

    if (prescriptionId) {
      query.prescription = prescriptionId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdherenceLog.find(query)
      .populate('prescription', 'diagnosis medications')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);

  } catch (error) {
    console.error('Error fetching adherence logs:', error);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
};

// Get adherence logs for specific patient (admin/doctor access)
const getAdherenceByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { prescriptionId, startDate, endDate, limit = 100 } = req.query;

    let query = { patient: patientId };

    if (prescriptionId) {
      query.prescription = prescriptionId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdherenceLog.find(query)
      .populate('prescription', 'diagnosis medications')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);

  } catch (error) {
    console.error('Error fetching adherence logs for patient:', error);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
};

// Get compliance score for specific patient (admin/doctor access)
const getComplianceByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all active prescriptions
    const prescriptions = await Prescription.find({
      patient: patientId,
      status: 'active'
    });

    if (prescriptions.length === 0) {
      return res.json({
        overallScore: 0,
        prescriptionScores: [],
        period: `${days} days`,
        message: 'No active prescriptions found'
      });
    }

    const prescriptionScores = [];

    for (const prescription of prescriptions) {
      const logs = await AdherenceLog.find({
        prescription: prescription._id,
        createdAt: { $gte: startDate }
      });

      const totalLogs = logs.length;
      const takenLogs = logs.filter(log => log.status === 'taken' || log.status === 'late').length;

      const score = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

      prescriptionScores.push({
        prescriptionId: prescription._id,
        diagnosis: prescription.diagnosis,
        score,
        totalLogs,
        takenLogs,
        medications: prescription.medications.length
      });
    }

    const overallScore = prescriptionScores.length > 0
      ? Math.round(prescriptionScores.reduce((sum, p) => sum + p.score, 0) / prescriptionScores.length)
      : 0;

    res.json({
      overallScore,
      prescriptionScores,
      period: `${days} days`,
      startDate,
      endDate: new Date()
    });

  } catch (error) {
    console.error('Error calculating compliance score for patient:', error);
    res.status(500).json({ message: 'Server error calculating score' });
  }
};

// Get adherence analytics (for doctors/admins)
const getAdherenceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, doctorId } = req.query;

    let matchQuery = {};

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    if (doctorId) {
      // Get prescriptions by this doctor
      const prescriptions = await Prescription.find({ doctor: doctorId }).select('_id');
      const prescriptionIds = prescriptions.map(p => p._id);
      matchQuery.prescription = { $in: prescriptionIds };
    }

    const analytics = await AdherenceLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            status: '$status',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          taken: {
            $sum: {
              $cond: [{ $in: ['$_id.status', ['taken', 'late']] }, '$count', 0]
            }
          },
          missed: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'missed'] }, '$count', 0]
            }
          },
          skipped: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'skipped'] }, '$count', 0]
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $project: {
          date: '$_id',
          taken: 1,
          missed: 1,
          skipped: 1,
          total: 1,
          complianceRate: {
            $cond: {
              if: { $gt: ['$total', 0] },
              then: { $multiply: [{ $divide: ['$taken', '$total'] }, 100] },
              else: 0
            }
          }
        }
      },
      { $sort: { date: -1 } },
      { $limit: 90 } // Last 90 days
    ]);

    // Get patient compliance summary
    const patientSummary = await AdherenceLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$patient',
          totalLogs: { $sum: 1 },
          takenLogs: {
            $sum: {
              $cond: [{ $in: ['$status', ['taken', 'late']] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          patient: '$_id',
          complianceRate: {
            $cond: {
              if: { $gt: ['$totalLogs', 0] },
              then: { $multiply: [{ $divide: ['$takenLogs', '$totalLogs'] }, 100] },
              else: 0
            }
          },
          totalLogs: 1,
          takenLogs: 1
        }
      },
      { $sort: { complianceRate: -1 } }
    ]);

    res.json({
      dailyAnalytics: analytics,
      patientSummary: patientSummary.slice(0, 20), // Top 20 patients
      summary: {
        totalLogs: analytics.reduce((sum, day) => sum + day.total, 0),
        averageCompliance: analytics.length > 0
          ? Math.round(analytics.reduce((sum, day) => sum + day.complianceRate, 0) / analytics.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Error fetching adherence analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// Get compliance score for current patient
const getComplianceScore = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all active prescriptions for patient
    const prescriptions = await Prescription.find({
      patient: patientId,
      status: 'active'
    }).populate('medications');

    if (prescriptions.length === 0) {
      return res.json({
        overallScore: 0,
        prescriptionScores: [],
        period: `${days} days`,
        startDate,
        endDate: new Date()
      });
    }

    const prescriptionScores = [];

    for (const prescription of prescriptions) {
      const logs = await AdherenceLog.find({
        prescription: prescription._id,
        createdAt: { $gte: startDate }
      });

      const totalLogs = logs.length;
      const takenLogs = logs.filter(log => log.status === 'taken' || log.status === 'late').length;

      const score = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

      prescriptionScores.push({
        prescriptionId: prescription._id,
        diagnosis: prescription.diagnosis,
        score,
        totalLogs,
        takenLogs,
        medications: prescription.medications.length
      });
    }

    const overallScore = prescriptionScores.length > 0
      ? Math.round(prescriptionScores.reduce((sum, p) => sum + p.score, 0) / prescriptionScores.length)
      : 0;

    res.json({
      overallScore,
      prescriptionScores,
      period: `${days} days`,
      startDate,
      endDate: new Date()
    });

  } catch (error) {
    console.error('Error calculating compliance score:', error);
    res.status(500).json({ message: 'Server error calculating score' });
  }
};

// Helper function to update prescription adherence score
const updatePrescriptionAdherence = async (prescriptionId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await AdherenceLog.find({
      prescription: prescriptionId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalLogs = logs.length;
    const takenLogs = logs.filter(log => log.status === 'taken' || log.status === 'late').length;

    const score = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

    await Prescription.findByIdAndUpdate(prescriptionId, {
      adherenceScore: score,
      lastAdherenceUpdate: new Date()
    });

  } catch (error) {
    console.error('Error updating prescription adherence:', error);
  }
};

module.exports = {
  markAdherence,
  getAdherenceLogs,
  getComplianceScore,
  getAdherenceAnalytics,
  getAdherenceByPatient,
  getComplianceByPatient,
  updatePrescriptionAdherence
};