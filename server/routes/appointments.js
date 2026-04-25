const express = require('express');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const router = express.Router();

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

// GET available slots
router.get('/slots/:doctorId/:date', protect, async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['booked', 'confirmed', 'completed'] }
    });

    const bookedMap = {};
    booked.forEach(a => { bookedMap[a.timeSlot] = a._id; });

    const slots = TIME_SLOTS.map(time => ({
      time,
      available: !bookedMap[time],
      appointmentId: bookedMap[time] || null
    }));

    res.json({ slots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Book appointment
router.post('/book', protect, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, reason } = req.body;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const existing = await Appointment.findOne({
      doctorId,
      date: dayStart,
      timeSlot,
      status: { $in: ['booked', 'confirmed', 'completed'] }
    });

    if (existing) return res.status(400).json({ message: 'Slot already booked' });

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date: dayStart,
      timeSlot,
      type: type || 'in-person',
      status: 'booked',
      reason: reason || ''
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email specialization');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's appointments
router.get('/my', protect, async (req, res) => {
  try {
    const query = req.user.role === 'patient'
      ? { patientId: req.user._id }
      : { doctorId: req.user._id };

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email bloodGroup phone')
      .populate('doctorId', 'name email specialization hospital')
      .sort({ date: -1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel appointment
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Not found' });

    if (appt.patientId.toString() !== req.user._id.toString() && appt.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appt.status = 'cancelled';
    await appt.save();
    res.json(appt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete appointment
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Not found' });
    if (appt.doctorId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    appt.status = 'completed';
    await appt.save();
    res.json(appt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
