const mongoose = require('mongoose');

const DrugInteractionSchema = new mongoose.Schema({
  drug1: { type: String, required: true, index: true },
  drug2: { type: String, required: true, index: true },
  severity: {
    type: String,
    enum: ['major', 'moderate', 'minor'],
    required: true
  },
  description: { type: String, required: true },
  source: { type: String, default: 'DrugBank' },
  category: { type: String, default: 'interaction' }, // interaction, contraindication, etc.
  evidenceLevel: { type: String, enum: ['high', 'moderate', 'low'], default: 'moderate' },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for efficient lookups
DrugInteractionSchema.index({ drug1: 1, drug2: 1 });
DrugInteractionSchema.index({ drug2: 1, drug1: 1 }); // Reverse lookup

module.exports = mongoose.model('DrugInteraction', DrugInteractionSchema);