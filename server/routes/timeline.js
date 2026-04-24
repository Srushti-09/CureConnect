const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const HealthRecord = require('../models/HealthRecord');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const router = express.Router();

let genAI = null;

router.get('/', protect, async (req, res) => {
  try {
    if (!genAI) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: 'GEMINI_API_KEY not configured in .env' });
      }
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    
    const [rawRecords, rawAppointments] = await Promise.all([
      HealthRecord.find({ patient: req.user._id }).populate('doctor', 'name').sort('-date'),
      Appointment.find({ patient: req.user._id }).populate('doctor', 'name').sort('-date')
    ]);

    // Fallback if no data
    if (rawRecords.length === 0 && rawAppointments.length === 0) {
      return res.json([]);
    }

    const compiledData = {
      appointments: rawAppointments.map(a => ({ date: a.date, type: a.type, doctor: a.doctor?.name, status: a.status })),
      records: rawRecords.map(r => ({ date: r.date, title: r.title, type: r.type, file: r.fileName }))
    };

    const dataPrompt = `
      Patient Name: ${req.user.name}
      Data: ${JSON.stringify(compiledData)}
      
      You are an expert AI medical chronologist. Read the patient's records and appointments and output a valid JSON array of timeline events summarizing their health history chronologically (newest first).
      Combine events that happen on similar dates if they are related.
      
      For each event, create the following strict JSON schema:
      [{
        "id": "unique string or number",
        "date": "MMM DD, YYYY",
        "title": "Short descriptive title (max 5 words)",
        "description": "1-2 sentence intelligent clinical summary combining the data points logically.",
        "type": "Must be exactly one of: 'checkup', 'lab', 'medication', 'procedure', or 'upload'",
        "doctor": "Doctor name or 'Platform System'",
        "color": "A hex color code suitable for the event type (e.g., #00d4ff for checkup, #f59e0b for lab, #8b5cf6 for medication, #00ff88 for procedure, #ec4899 for upload)"
      }]
      
      Return ONLY a JSON array.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(dataPrompt);
    let text = result.response.text().trim();
    
    // Robust extraction of JSON array using regex
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Gemini model did not return a valid JSON array format.');
    }
    
    text = jsonMatch[0];
    const timelineData = JSON.parse(text);
    res.json(timelineData);
  } catch (error) {
    console.error("Gemini Timeline Error:", error);
    res.status(500).json({ message: "Failed to generate timeline", error: error.message });
  }
});

module.exports = router;
