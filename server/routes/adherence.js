const express = require('express');
const { protect, doctorOnly, patientOnly } = require('../middleware/auth');
const {
  markAdherence,
  getAdherenceLogs,
  getComplianceScore,
  getAdherenceAnalytics,
  getAdherenceByPatient,
  getComplianceByPatient
} = require('../controllers/adherenceController');

const router = express.Router();

// Patient routes
router.post('/mark', protect, patientOnly, markAdherence);
router.get('/logs', protect, patientOnly, getAdherenceLogs);
router.get('/compliance', protect, patientOnly, getComplianceScore);

// Doctor/Admin routes
router.get('/:patientId', protect, doctorOnly, getAdherenceByPatient);
router.get('/compliance/:patientId', protect, doctorOnly, getComplianceByPatient);
router.get('/analytics', protect, doctorOnly, getAdherenceAnalytics);

module.exports = router;