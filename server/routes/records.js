const express = require('express');
const HealthRecord = require('../models/HealthRecord');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/records — get records for current user
router.get('/', protect, async (req, res) => {
  try {
    let records;
    if (req.user.role === 'patient') {
      records = await HealthRecord.find({ patient: req.user._id }).populate('doctor', 'name specialization').sort('-date');
    } else {
      records = await HealthRecord.find({ sharedWith: req.user._id }).populate('patient', 'name bloodGroup').sort('-date');
    }
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/records
router.post('/', protect, async (req, res) => {
  try {
    const record = await HealthRecord.create({ ...req.body, patient: req.user._id });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/records/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const record = await HealthRecord.findOneAndUpdate(
      { _id: req.params.id, patient: req.user._id },
      req.body, { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/records/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await HealthRecord.findOneAndDelete({ _id: req.params.id, patient: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
