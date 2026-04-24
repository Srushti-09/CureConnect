const DrugInteraction = require('../models/DrugInteraction');
const Prescription = require('../models/Prescription');

// Check drug interactions for a list of medications
const checkInteractions = async (req, res) => {
  try {
    const { medications } = req.body; // Array of medication names

    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return res.status(400).json({ message: 'At least 2 medications required for interaction check' });
    }

    const normalizedMeds = medications.map(med => med.toLowerCase().trim());

    // Find all interactions between the provided medications
    const interactions = await DrugInteraction.find({
      $or: [
        { drug1: { $in: normalizedMeds }, drug2: { $in: normalizedMeds } },
        { drug2: { $in: normalizedMeds }, drug1: { $in: normalizedMeds } }
      ]
    }).sort({ severity: -1 }); // Major first

    // Group interactions by severity
    const groupedInteractions = {
      major: [],
      moderate: [],
      minor: []
    };

    interactions.forEach(interaction => {
      const severity = interaction.severity;
      if (groupedInteractions[severity]) {
        groupedInteractions[severity].push({
          drugs: [interaction.drug1, interaction.drug2],
          description: interaction.description,
          source: interaction.source,
          evidenceLevel: interaction.evidenceLevel
        });
      }
    });

    res.json({
      hasInteractions: interactions.length > 0,
      totalInteractions: interactions.length,
      interactions: groupedInteractions,
      medications: normalizedMeds
    });

  } catch (error) {
    console.error('Error checking drug interactions:', error);
    res.status(500).json({ message: 'Server error checking interactions' });
  }
};

// Get all drug interactions (for admin)
const getAllInteractions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const interactions = await DrugInteraction.find()
      .sort({ severity: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DrugInteraction.countDocuments();

    res.json({
      interactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching drug interactions:', error);
    res.status(500).json({ message: 'Server error fetching interactions' });
  }
};

// Add new drug interaction (admin only)
const addInteraction = async (req, res) => {
  try {
    const { drug1, drug2, severity, description, source, category, evidenceLevel } = req.body;

    if (!drug1 || !drug2 || !severity || !description) {
      return res.status(400).json({ message: 'Required fields: drug1, drug2, severity, description' });
    }

    // Check if interaction already exists
    const existing = await DrugInteraction.findOne({
      $or: [
        { drug1: drug1.toLowerCase(), drug2: drug2.toLowerCase() },
        { drug1: drug2.toLowerCase(), drug2: drug1.toLowerCase() }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: 'Interaction already exists between these drugs' });
    }

    const interaction = await DrugInteraction.create({
      drug1: drug1.toLowerCase(),
      drug2: drug2.toLowerCase(),
      severity,
      description,
      source: source || 'Manual Entry',
      category: category || 'interaction',
      evidenceLevel: evidenceLevel || 'moderate'
    });

    res.status(201).json(interaction);

  } catch (error) {
    console.error('Error adding drug interaction:', error);
    res.status(500).json({ message: 'Server error adding interaction' });
  }
};

module.exports = {
  checkInteractions,
  getAllInteractions,
  addInteraction
};