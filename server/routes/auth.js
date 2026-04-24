const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const { protect } = require('../middleware/auth');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'cureconnect_super_secret_jwt_key_2024', { expiresIn: '30d' });

// POST /api/auth/register  ← Creates a new user in MongoDB
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role,
      specialization, hospital, licenseNumber,
      bloodGroup, dateOfBirth, gender, phone,
      height, weight, chronicConditions, allergies, pastDocuments
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered. Please sign in.' });

    let healthScore = 95;
    if (role === 'patient') {
      const conditionsCount = Array.isArray(chronicConditions) ? chronicConditions.length : 0;
      const allergiesCount = Array.isArray(allergies) ? allergies.length : 0;
      healthScore -= (10 * conditionsCount);
      healthScore -= (5 * allergiesCount);
      if (weight && height) {
        const bmi = weight / ((height / 100) * (height / 100));
        if (bmi > 25 || bmi < 18.5) healthScore -= 5;
      }
      healthScore = Math.max(healthScore, 40); // minimum 40
    }

    const user = await User.create({
      name, email, password, role, phone: phone || '',
      ...(role === 'doctor' && { specialization, hospital, licenseNumber }),
      ...(role === 'patient' && { 
        bloodGroup, dateOfBirth, gender,
        height, weight, chronicConditions, allergies,
        healthScore
      })
    });

    console.log(`✅ New ${role} registered: ${user.name} (${user.email}) — ID: ${user._id}`);

    if (pastDocuments && pastDocuments.length > 0 && role === 'patient') {
      try {
        const recordsToInsert = pastDocuments.map(doc => ({
          patient: user._id,
          title: doc.title || doc.fileName,
          type: doc.type || 'lab_report',
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          fileType: doc.fileType || 'application/pdf',
          date: new Date()
        }));
        await HealthRecord.insertMany(recordsToInsert);
        console.log(`✅ Uploaded ${pastDocuments.length} past documents for ${user.name}`);
      } catch (err) {
        console.error('Failed to save past documents during registration:', err.message);
      }
    }

    res.status(201).json({
      ...user.toJSON(),
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    user.lastActive = new Date();
    await user.save();

    console.log(`🔑 Login: ${user.name} (${user.role})`);

    res.json({
      ...user.toJSON(),
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me  ← Verifies JWT and returns current user (used on page load)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
