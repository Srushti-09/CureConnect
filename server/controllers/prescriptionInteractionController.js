const DrugInteraction = require('../models/DrugInteraction');
const Prescription = require('../models/Prescription');

// Check drug interactions for a list of medicines
exports.checkInteractions = async (req, res) => {
  const { medicines } = req.body;
  
  if (!medicines || medicines.length < 2) {
    return res.json({ interactions: [], count: 0 });
  }

  const interactions = [];
  
  // Compare every medicine with others
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const drugA = medicines[i].name || medicines[i];
      const drugB = medicines[j].name || medicines[j];
      
      const foundInteraction = await DrugInteraction.findOne({
        $or: [
          { drugA, drugB },
          { drugA: drugB, drugB: drugA }
        ]
      });

      if (foundInteraction) {
        interactions.push(foundInteraction);
      }
    }
  }

  res.json({
    interactions,
    count: interactions.length,
    hasSevere: interactions.some(i => i.severity === 'Severe')
  });
};

// Save prescription after checking interactions
exports.savePrescription = async (req, res) => {
  try {
    const { patient, medications, notes, forceSave } = req.body;
    
    // Perform internal check again for safety
    const medicineNames = medications.map(m => m.name);
    const interactions = [];
    
    for (let i = 0; i < medicineNames.length; i++) {
      for (let j = i + 1; j < medicineNames.length; j++) {
        const match = await DrugInteraction.findOne({
          $or: [
            { drugA: medicineNames[i], drugB: medicineNames[j] },
            { drugA: medicineNames[j], drugB: medicineNames[i] }
          ]
        });
        if (match) interactions.push(match);
      }
    }

    const hasSevere = interactions.some(i => i.severity === 'Severe');
    
    if (hasSevere && !forceSave) {
      return res.status(409).json({
        message: 'Severe drug interaction detected. Confirmation required.',
        interactions
      });
    }

    const prescription = await Prescription.create({
      patient,
      doctor: req.user._id,
      medications,
      notes,
      status: 'active'
    });

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
