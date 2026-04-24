const mongoose = require('mongoose');

const AdherenceLogSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medication: {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }
  },
  scheduledTime: { type: Date, required: true },
  takenAt: { type: Date },
  status: {
    type: String,
    enum: ['taken', 'missed', 'skipped', 'late'],
    required: true
  },
  notes: { type: String, default: '' },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date }
}, { timestamps: true });

// Indexes for efficient queries
AdherenceLogSchema.index({ patient: 1, createdAt: -1 });
AdherenceLogSchema.index({ prescription: 1 });
AdherenceLogSchema.index({ scheduledTime: 1 });

module.exports = mongoose.model('AdherenceLog', AdherenceLogSchema);