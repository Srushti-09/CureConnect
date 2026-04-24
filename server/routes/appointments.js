const express = require('express');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'patient'
      ? { patient: req.user._id }
      : { doctor: req.user._id };
    const appointments = await Appointment.find(query)
      .populate('patient', 'name avatar bloodGroup phone')
      .populate('doctor', 'name specialization hospital avatar')
      .sort('date');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const appt = await Appointment.create({ ...req.body, patient: req.user._id });
    res.status(201).json(appt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(appt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
