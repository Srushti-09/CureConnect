const mongoose = require('mongoose');

const AccessCodeSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  
  // Creation time
  createdAt: { type: Date, default: Date.now },
  
  // This automatically deletes the document 60 seconds after the 'expiresAt' time
  // This demonstrates a Time-To-Live (TTL) Index!
  expiresAt: { type: Date, required: true }
});

// ─── TTL (Time-To-Live) Index ───
// The 'expireAfterSeconds: 0' tells MongoDB to delete the document exactly when 
// the clock hits the timestamp stored in the 'expiresAt' field.
AccessCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AccessCode', AccessCodeSchema);
