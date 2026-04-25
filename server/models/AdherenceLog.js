const mongoose = require('mongoose');

const AdherenceLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medication: {
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String }
  },
  scheduledTime: { type: Date },
  takenAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['taken', 'missed', 'skipped', 'late'],
    required: true
  },
  notes: { type: String, default: '' },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date }
}, { timestamps: true });

// Backward compatibility virtuals
AdherenceLogSchema.virtual('patient').get(function() { return this.patientId; }).set(function(v) { this.patientId = v; });
AdherenceLogSchema.virtual('prescription').get(function() { return this.prescriptionId; }).set(function(v) { this.prescriptionId = v; });
AdherenceLogSchema.virtual('medicineName').get(function() { return this.medication?.name; }).set(function(v) { 
  if (!this.medication) this.medication = {};
  this.medication.name = v; 
});
AdherenceLogSchema.virtual('date').get(function() { return this.takenAt; }).set(function(v) { this.takenAt = v; });

AdherenceLogSchema.index({ patientId: 1, createdAt: -1 });
AdherenceLogSchema.index({ prescriptionId: 1 });
AdherenceLogSchema.index({ scheduledTime: 1 });

module.exports = mongoose.model('AdherenceLog', AdherenceLogSchema);
