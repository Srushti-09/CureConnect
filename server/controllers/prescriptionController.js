const Prescription = require('../models/Prescription');
const DrugInteraction = require('../models/DrugInteraction');
const User = require('../models/User');

// Check drug interactions for medications (separate endpoint)
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
      medications: normalizedMeds,
      hasSevereInteractions: groupedInteractions.major.length > 0
    });

  } catch (error) {
    console.error('Error checking drug interactions:', error);
    res.status(500).json({ message: 'Server error checking interactions' });
  }
};

// Get prescriptions for user
const getPrescriptions = async (req, res) => {
  try {
    const query = req.user.role === 'patient' ? { patient: req.user._id } : { doctor: req.user._id };
    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name avatar bloodGroup allergies chronicConditions')
      .populate('doctor', 'name specialization licenseNumber')
      .sort('-createdAt');
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new prescription with interaction checking
const createPrescription = async (req, res) => {
  try {
    const { patient, medications, diagnosis, notes, appointment, confirmedSevereInteractions } = req.body;
    const doctorId = req.user._id;

    if (!patient || !medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ message: 'Patient and medications are required' });
    }

    // Verify patient exists and is a patient
    const patientUser = await User.findOne({ _id: patient, role: 'patient' });
    if (!patientUser) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check for drug interactions
    const medicationNames = medications.map(med => med.name.toLowerCase().trim());
    let interactionWarnings = [];

    if (medicationNames.length >= 2) {
      const interactions = await DrugInteraction.find({
        $or: [
          { drug1: { $in: medicationNames }, drug2: { $in: medicationNames } },
          { drug2: { $in: medicationNames }, drug1: { $in: medicationNames } }
        ]
      }).sort({ severity: -1 });

      interactionWarnings = interactions.map(interaction => ({
        severity: interaction.severity,
        description: interaction.description,
        drugs: [interaction.drug1, interaction.drug2],
        acknowledged: false
      }));
    }

    // Check if there are severe interactions and confirmation is required
    const hasSevereInteractions = interactionWarnings.some(w => w.severity === 'major');
    if (hasSevereInteractions && !confirmedSevereInteractions) {
      return res.status(400).json({
        message: 'Severe drug interactions detected. Please confirm before saving.',
        requiresConfirmation: true,
        severeInteractions: interactionWarnings.filter(w => w.severity === 'major')
      });
    }

    // Combine warnings
    const allWarnings = [...interactionWarnings, ...allergyWarnings];

    // Create prescription
    const prescription = await Prescription.create({
      patient,
      doctor: doctorId,
      appointment,
      medications,
      diagnosis: diagnosis || '',
      notes: notes || '',
      interactionWarnings: allWarnings,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    // Populate and return
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name avatar bloodGroup')
      .populate('doctor', 'name specialization licenseNumber');

    res.status(201).json({
      ...populatedPrescription.toObject(),
      warningsGenerated: allWarnings.length > 0,
      warningCount: allWarnings.length
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update prescription
const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('patient', 'name avatar bloodGroup')
     .populate('doctor', 'name specialization licenseNumber');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: error.message });
  }
};

// Acknowledge interaction warning
const acknowledgeWarning = async (req, res) => {
  try {
    const { prescriptionId, warningIndex } = req.params;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Verify doctor owns prescription
    if (prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!prescription.interactionWarnings[warningIndex]) {
      return res.status(400).json({ message: 'Warning not found' });
    }

    prescription.interactionWarnings[warningIndex].acknowledged = true;
    prescription.interactionWarnings[warningIndex].acknowledgedAt = new Date();
    prescription.interactionWarnings[warningIndex].acknowledgedBy = req.user._id;

    await prescription.save();

    res.json({ message: 'Warning acknowledged', warning: prescription.interactionWarnings[warningIndex] });

  } catch (error) {
    console.error('Error acknowledging warning:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  acknowledgeWarning,
  checkInteractions
};