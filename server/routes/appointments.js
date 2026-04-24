const express = require('express');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const router = express.Router();

// ─── Fixed time slots ───────────────────────────────────────────────────────
const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

// ─── GET /api/appointments/slots/:doctorId/:date ────────────────────────────
// Returns all 12 time slots with availability status for a given doctor + date
router.get('/slots/:doctorId/:date', protect, async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    // Build date range for the full day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all booked/completed appointments for this doctor on this date
    const booked = await Appointment.find({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['booked', 'completed'] }
    });

    const bookedMap = {};
    booked.forEach(a => {
      bookedMap[a.timeSlot] = a._id;
    });

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

// ─── POST /api/appointments/book ────────────────────────────────────────────
// Book a new appointment
router.post('/book', protect, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    // Build date range for double-booking check
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Check if slot is already booked
    const existing = await Appointment.findOne({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      timeSlot,
      status: { $in: ['booked', 'completed'] }
    });

    if (existing) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date: dayStart,
      timeSlot,
      status: 'booked',
      reason: reason || ''
    });

    // Populate doctor and patient info before returning
    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email specialization');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/appointments/my ───────────────────────────────────────────────
// Get current user's appointments (patient sees theirs, doctor sees theirs)
router.get('/my', protect, async (req, res) => {
  try {
    const query = req.user.role === 'patient'
      ? { patientId: req.user._id }
      : { doctorId: req.user._id };

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email specialization')
      .sort({ date: -1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT /api/appointments/:id/cancel ───────────────────────────────────────
// Patient can cancel their own, doctor can cancel any of their appointments
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Authorization: patient can cancel their own, doctor can cancel theirs
    const isPatient = appointment.patientId.toString() === req.user._id.toString();
    const isDoctor = appointment.doctorId.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email specialization');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT /api/appointments/:id/complete ─────────────────────────────────────
// Only the doctor can mark an appointment as completed
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the doctor of this appointment can complete it
    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the doctor can mark an appointment as completed' });
    }

    if (appointment.status !== 'booked') {
      return res.status(400).json({ message: 'Only booked appointments can be marked as completed' });
    }

    appointment.status = 'completed';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email specialization');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
