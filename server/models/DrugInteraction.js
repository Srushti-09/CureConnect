const mongoose = require('mongoose');

const DrugInteractionSchema = new mongoose.Schema({
  drugA: { type: String, required: true, trim: true },
  drugB: { type: String, required: true, trim: true },
  severity: { 
    type: String, 
    enum: ['Mild', 'Moderate', 'Severe'], 
    required: true 
  },
  warning: { type: String, required: true }
}, { timestamps: true });

// Index for faster searching
DrugInteractionSchema.index({ drugA: 1, drugB: 1 });

module.exports = mongoose.model('DrugInteraction', DrugInteractionSchema);
