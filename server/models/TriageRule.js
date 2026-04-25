const mongoose = require('mongoose');

const triageRuleSchema = new mongoose.Schema({
  symptomKeyword: { type: String, required: true },
  priority: { type: String, enum: ['Red', 'Yellow', 'Green'], required: true },
  score: { type: Number, required: true },
  specialistType: { type: String, required: true },
  urgencyEstimate: { type: String, required: true }
});

module.exports = mongoose.model('TriageRule', triageRuleSchema);
