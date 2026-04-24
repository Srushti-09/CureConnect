const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cureconnect_super_secret_jwt_key_2024');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const doctorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') return next();
  res.status(403).json({ message: 'Access restricted to doctors only' });
};

const patientOnly = (req, res, next) => {
  if (req.user && req.user.role === 'patient') return next();
  res.status(403).json({ message: 'Access restricted to patients only' });
};

module.exports = { protect, doctorOnly, patientOnly };
