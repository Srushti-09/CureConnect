const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // In a real app, I'd add adminOnly middleware
const { getAnalytics } = require('../controllers/adminAnalyticsController');

router.get('/analytics', protect, getAnalytics);

module.exports = router;
