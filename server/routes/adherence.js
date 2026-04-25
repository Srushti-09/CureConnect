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
router.post('/mark', protect, markAdherence); // Allow both for backend calls, but usually patient-only
router.get('/logs', protect, getAdherenceLogs); // Combined logs getter
router.get('/compliance', protect, getComplianceScore);

// Specific patient routes (Doctor/Admin)
router.get('/analytics', protect, doctorOnly, getAdherenceAnalytics);
router.get('/:patientId', protect, getAdherenceByPatient);
router.get('/compliance/:patientId', protect, getComplianceByPatient);

module.exports = router;
