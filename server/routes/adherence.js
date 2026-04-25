const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  markAdherence, 
  getAdherenceLogs, 
  getComplianceScore 
} = require('../controllers/adherenceController');

router.post('/mark', protect, markAdherence);
router.get('/:patientId', protect, getAdherenceLogs);
router.get('/compliance/:patientId', protect, getComplianceScore);

module.exports = router;
