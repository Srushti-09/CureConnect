const mongoose = require('mongoose');

const AdherenceLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medicineName: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  status: { 
    type: String, 
    enum: ['Taken', 'Missed'], 
    required: true 
  }
}, { timestamps: true });

// Index for reporting and analytics
AdherenceLogSchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('AdherenceLog', AdherenceLogSchema);
