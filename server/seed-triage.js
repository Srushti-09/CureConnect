require('dotenv').config();
const mongoose = require('mongoose');
const TriageRule = require('./models/TriageRule');

const rules = [
  { symptomKeyword: 'chest pain', priority: 'Red', score: 10, specialistType: 'Cardiologist', urgencyEstimate: 'Immediate (ER)' },
  { symptomKeyword: 'breathing', priority: 'Red', score: 9, specialistType: 'Pulmonologist', urgencyEstimate: 'Immediate (ER)' },
  { symptomKeyword: 'numbness', priority: 'Red', score: 8, specialistType: 'Neurologist', urgencyEstimate: 'Within 2-4 hours' },
  { symptomKeyword: 'fever', priority: 'Yellow', score: 4, specialistType: 'General Physician', urgencyEstimate: 'Within 24 hours' },
  { symptomKeyword: 'vomiting', priority: 'Yellow', score: 3, specialistType: 'Gastroenterologist', urgencyEstimate: 'Within 24 hours' },
  { symptomKeyword: 'headache', priority: 'Yellow', score: 2, specialistType: 'General Physician', urgencyEstimate: 'Within 24-48 hours' },
  { symptomKeyword: 'rash', priority: 'Green', score: 1, specialistType: 'Dermatologist', urgencyEstimate: 'Within 3-5 days' },
  { symptomKeyword: 'cough', priority: 'Green', score: 1, specialistType: 'Pulmonologist / General', urgencyEstimate: 'Within 3-5 days' }
];

async function seedMatrix() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cureconnect');
    console.log('MongoDB Connected for Triage Seeding');
    
    // Note: Commented out deleteMany() so you don't accidentally wipe Srushti's data!
    // await TriageRule.deleteMany();
    await TriageRule.insertMany(rules);
    
    console.log('✅ Smart Triage Matrix seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedMatrix();
