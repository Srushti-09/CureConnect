const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DrugInteraction = require('./models/DrugInteraction');

dotenv.config();

const drugInteractions = [
  {
    drugA: "Paracetamol",
    drugB: "Ibuprofen",
    severity: "Moderate",
    warning: "May increase stomach irritation and risk of gastrointestinal issues."
  },
  {
    drugA: "Aspirin",
    drugB: "Warfarin",
    severity: "Severe",
    warning: "High risk of internal bleeding. Avoid combination unless strictly monitored."
  },
  {
    drugA: "Amoxicillin",
    drugB: "Methotrexate",
    severity: "Moderate",
    warning: "Amoxicillin can reduce the excretion of methotrexate, increasing toxicity risks."
  },
  {
    drugA: "Simvastatin",
    drugB: "Amlodipine",
    severity: "Mild",
    warning: "Amlodipine may increase blood levels of simvastatin. Monitor for muscle pain."
  },
  {
    drugA: "Metformin",
    drugB: "Contrast Dye",
    severity: "Severe",
    warning: "Risk of lactic acidosis. Stop metformin 48 hours before and after imaging procedures."
  },
  {
    drugA: "Lisinopril",
    drugB: "Spironolactone",
    severity: "Moderate",
    warning: "Both drugs increase potassium levels. Risk of hyperkalemia."
  }
];

const seedInteractions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding interactions...');
    
    await DrugInteraction.deleteMany();
    console.log('Cleared existing interactions.');
    
    await DrugInteraction.insertMany(drugInteractions);
    console.log('Seeded drug interactions successfully!');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding interactions:', error);
    process.exit(1);
  }
};

seedInteractions();
