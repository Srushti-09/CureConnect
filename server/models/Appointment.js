const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // Unified field for time
  duration: { type: Number, default: 30 },
  type: {
    type: String,
    enum: ['in-person', 'video', 'phone'],
    default: 'in-person'
  },
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'cancelled', 'completed'],
    default: 'booked'
  },
  reason: { type: String, default: '' },
  notes: { type: String, default: '' },
  reminded: { type: Boolean, default: false },
  meetingLink: { type: String, default: '' }
}, { timestamps: true });

// Aliases for compatibility
AppointmentSchema.virtual('patient').get(function() { return this.patientId; }).set(function(v) { this.patientId = v; });
AppointmentSchema.virtual('doctor').get(function() { return this.doctorId; }).set(function(v) { this.doctorId = v; });
AppointmentSchema.virtual('time').get(function() { return this.timeSlot; }).set(function(v) { this.timeSlot = v; });

AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ date: 1, timeSlot: 1 });
AppointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });
AppointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
