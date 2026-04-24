const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, default: '' },
    genericName: { type: String, default: '' },
    drugClass: { type: String, default: '' }
  }],
  diagnosis: { type: String, default: '' },
  notes: { type: String, default: '' },
  validUntil: { type: Date },
  isDigitallySigned: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  interactionWarnings: [{
    severity: { type: String, enum: ['major', 'moderate', 'minor'] },
    description: { type: String },
    drugs: [String],
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  adherenceScore: { type: Number, default: 0, min: 0, max: 100 },
  lastAdherenceUpdate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
