const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 30 }, // minutes
  type: {
    type: String,
    enum: ['in-person', 'video', 'phone'],
    default: 'in-person'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  reason: { type: String, default: '' },
  notes: { type: String, default: '' },
  reminded: { type: Boolean, default: false },
  meetingLink: { type: String, default: '' }
}, { timestamps: true });

// ─── Indexes for performance ───
AppointmentSchema.index({ patient: 1 });
AppointmentSchema.index({ doctor: 1 });
AppointmentSchema.index({ date: 1, time: 1 });
AppointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
