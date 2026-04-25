const express = require('express');
const { protect, doctorOnly } = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  acknowledgeWarning,
  checkInteractions
} = require('../controllers/prescriptionController');

// Fallback to separate controller for compatibility if needed
// const { savePrescription } = require('../controllers/prescriptionInteractionController');

const router = express.Router();

// GET /api/prescriptions
router.get('/', protect, getPrescriptions);

// POST /api/prescriptions/check-interactions
router.post('/check-interactions', protect, checkInteractions);

// POST /api/prescriptions
router.post('/', protect, doctorOnly, createPrescription);

// Alias for consistency with some frontend calls
router.post('/save', protect, doctorOnly, createPrescription);

// PUT /api/prescriptions/:id
router.put('/:id', protect, doctorOnly, updatePrescription);

// PUT /api/prescriptions/:id/acknowledge/:warningIndex
router.put('/:id/acknowledge/:warningIndex', protect, doctorOnly, acknowledgeWarning);

module.exports = router;
