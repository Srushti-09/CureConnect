const express = require('express');
const { protect, doctorOnly } = require('../middleware/auth');
const {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  acknowledgeWarning,
  checkInteractions
} = require('../controllers/prescriptionController');

const router = express.Router();

router.get('/', protect, getPrescriptions);
router.post('/check-interactions', protect, checkInteractions);
router.post('/', protect, doctorOnly, createPrescription);
router.put('/:id', protect, doctorOnly, updatePrescription);
router.put('/:id/acknowledge/:warningIndex', protect, doctorOnly, acknowledgeWarning);

module.exports = router;
