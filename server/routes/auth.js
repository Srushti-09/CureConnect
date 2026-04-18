const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register  ← Creates a new user in MongoDB
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role,
      specialization, hospital, licenseNumber,
      bloodGroup, dateOfBirth, gender, phone
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered. Please sign in.' });

    const user = await User.create({
      name, email, password, role, phone: phone || '',
      ...(role === 'doctor' && { specialization, hospital, licenseNumber }),
      ...(role === 'patient' && { bloodGroup, dateOfBirth, gender })
    });

    console.log(`✅ New ${role} registered: ${user.name} (${user.email}) — ID: ${user._id}`);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      healthScore: user.healthScore,
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
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      healthScore: user.healthScore,
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
