const mongoose = require('mongoose');

// ── Symptom Log Schema ──
// Each document = one daily symptom entry from a patient.
// Indexes are optimized for time-series aggregation queries.
const symptomSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symptoms: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  }],
  severity: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// ── Indexes for efficient time-series queries ──
// Compound index: find a patient's symptoms sorted by date (descending)
symptomSchema.index({ patient: 1, date: -1 });

// Single-field index: range queries on date for aggregation pipelines
symptomSchema.index({ date: 1 });

module.exports = mongoose.model('Symptom', symptomSchema);
