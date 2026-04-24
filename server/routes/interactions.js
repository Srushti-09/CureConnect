const express = require('express');
const { protect, doctorOnly } = require('../middleware/auth');
const {
  checkInteractions,
  getAllInteractions,
  addInteraction
} = require('../controllers/drugInteractionController');

const router = express.Router();

// Check interactions for medications
router.post('/check', protect, checkInteractions);

// Admin routes for managing interactions
router.get('/', protect, doctorOnly, getAllInteractions);
router.post('/', protect, doctorOnly, addInteraction);

module.exports = router;