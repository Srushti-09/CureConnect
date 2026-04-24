const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['patient', 'doctor'], required: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },

  // Patient-specific
  bloodGroup: { type: String, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' }
  },
  height: { type: Number },
  weight: { type: Number },

  // Doctor-specific
  specialization: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  hospital: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },

  // Shared
  isVerified: { type: Boolean, default: false },
  healthScore: { type: Number, default: 72, min: 0, max: 100 },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ─── Indexes for performance ───
// email is automatically indexed due to unique: true
UserSchema.index({ role: 1 });
UserSchema.index({ name: 1 });
UserSchema.index({ joinedAt: -1 });

// ─── Multikey Array Index ───
// This creates an index structure mapping every item in the array to the document
UserSchema.index({ chronicConditions: 1 });

// ─── Covered Query (Compound + Array) Index ───
// Querying .find({ bloodGroup: 'O+', chronicConditions: 'Diabetes' }).select('bloodGroup chronicConditions -_id')
// will be fully resolved IN-MEMORY from this index without touching the disk collection!
UserSchema.index({ bloodGroup: 1, chronicConditions: 1 });

module.exports = mongoose.model('User', UserSchema);
