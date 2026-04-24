const mongoose = require('mongoose');

const HealthRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['lab_report', 'prescription', 'imaging', 'consultation', 'vaccination', 'surgery', 'other'],
    default: 'other'
  },
  description: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileType: { type: String, default: '' },
  tags: [String],
  isSharedWithDoctor: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  date: { type: Date, default: Date.now },
  isBlockchainVerified: { type: Boolean, default: false },
  blockchainHash: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);
