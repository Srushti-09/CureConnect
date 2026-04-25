const express = require('express');
const Prescription = require('../models/Prescription');
const { protect, doctorOnly } = require('../middleware/auth');
const router = express.Router();
const { checkInteractions, savePrescription } = require('../controllers/prescriptionInteractionController');

router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'patient' ? { patient: req.user._id } : { doctor: req.user._id };
    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name avatar bloodGroup')
      .populate('doctor', 'name specialization licenseNumber')
      .sort('-createdAt');
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, doctorOnly, savePrescription);
router.post('/save', protect, doctorOnly, savePrescription); // Alias for consistency with request

router.post('/check-interactions', protect, doctorOnly, checkInteractions);

router.put('/:id', protect, doctorOnly, async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
