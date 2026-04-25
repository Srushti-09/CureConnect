require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const AccessCode = require('./models/AccessCode');

const seedDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined. Check your .env file in server/ folder.');
    }
    
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected. Clearing existing data...');
    // Wipe all users and codes before seeding
    await User.deleteMany({});
    await AccessCode.deleteMany({});
    
    console.log('🌱 Seeding database...');

    // ─── 5 Doctors ───
    const doctors = [
      {
        name: 'Dr. Sarah Chen', email: 'dr.chen@cureconnect.com', password: 'demo_password123',
        role: 'doctor', specialization: 'Cardiologist', licenseNumber: 'MD-99824-2026',
        hospital: 'Apex Heart Institute', experience: 12, rating: 4.9, phone: '+1 800-456-1122', isVerified: true
      },
      {
        name: 'Dr. Raj Kumar', email: 'dr.kumar@cureconnect.com', password: 'demo_password123',
        role: 'doctor', specialization: 'Endocrinologist', licenseNumber: 'MD-77341-2025',
        hospital: 'City Central Hospital', experience: 15, rating: 4.8, phone: '+1 800-456-2233', isVerified: true
      },
      {
        name: 'Dr. Priya Mehta', email: 'dr.mehta@cureconnect.com', password: 'demo_password123',
        role: 'doctor', specialization: 'General Physician', licenseNumber: 'MD-11922-2027',
        hospital: 'CureConnect Virtual Clinics', experience: 8, rating: 5.0, phone: '+1 800-456-3344', isVerified: true
      },
      {
        name: 'Dr. Aman Verma', email: 'dr.verma@cureconnect.com', password: 'demo_password123',
        role: 'doctor', specialization: 'Pulmonologist', licenseNumber: 'MD-44281-2028',
        hospital: 'Metro Respiratory Care', experience: 20, rating: 4.7, phone: '+1 800-456-4455', isVerified: true
      },
      {
        name: 'Dr. Neha Sharma', email: 'dr.sharma@cureconnect.com', password: 'demo_password123',
        role: 'doctor', specialization: 'Dermatologist', licenseNumber: 'MD-88123-2029',
        hospital: 'Skin & Beauty Clinic', experience: 6, rating: 4.6, phone: '+1 800-456-5566', isVerified: true
      }
    ];

    // ─── 20 Patients ───
    const patients = [
      { name: 'James Walker', email: 'james.walker@test.com', bloodGroup: 'O+', gender: 'male', healthScore: 78, chronicConditions: ['Hypertension'] },
      { name: 'Emma Reynolds', email: 'emma.r@test.com', bloodGroup: 'A-', gender: 'female', healthScore: 92, chronicConditions: [] },
      { name: 'Marcus Chen', email: 'marcus@test.com', bloodGroup: 'B+', gender: 'male', healthScore: 85, chronicConditions: ['Asthma'] },
      { name: 'Priya Sharma', email: 'priya@test.com', bloodGroup: 'AB+', gender: 'female', healthScore: 88, chronicConditions: ['Diabetes Type 2'] },
      { name: 'Liam Neeson', email: 'liam.n@test.com', bloodGroup: 'O-', gender: 'male', healthScore: 95, chronicConditions: [] },
      { name: 'Sophia Patel', email: 'sophia.p@test.com', bloodGroup: 'A+', gender: 'female', healthScore: 65, chronicConditions: ['Anemia', 'Migraines'] },
      { name: 'Benjamin Clark', email: 'ben.c@test.com', bloodGroup: 'B-', gender: 'male', healthScore: 71, chronicConditions: ['Arthritis'] },
      { name: 'Isabella Davis', email: 'isabella.d@test.com', bloodGroup: 'O+', gender: 'female', healthScore: 82, chronicConditions: [] },
      { name: 'Elias Thorne', email: 'elias.t@test.com', bloodGroup: 'AB-', gender: 'male', healthScore: 60, chronicConditions: ['Chronic Kidney Disease'] },
      { name: 'Aisha Gupta', email: 'aisha.g@test.com', bloodGroup: 'B+', gender: 'female', healthScore: 98, chronicConditions: [] },
      { name: 'Carlos Mendoza', email: 'carlos.m@test.com', bloodGroup: 'A+', gender: 'male', healthScore: 75, chronicConditions: ['High Cholesterol'] },
      { name: 'Mia Wong', email: 'mia.w@test.com', bloodGroup: 'O+', gender: 'female', healthScore: 90, chronicConditions: [] },
      { name: 'Noah Evans', email: 'noah.e@test.com', bloodGroup: 'A-', gender: 'male', healthScore: 81, chronicConditions: ['Asthma'] },
      { name: 'Ava Fischer', email: 'ava.f@test.com', bloodGroup: 'O-', gender: 'female', healthScore: 89, chronicConditions: [] },
      { name: 'Ethan Wright', email: 'ethan.w@test.com', bloodGroup: 'B+', gender: 'male', healthScore: 68, chronicConditions: ['Type 1 Diabetes'] },
      { name: 'Chloe Kim', email: 'chloe.k@test.com', bloodGroup: 'AB+', gender: 'female', healthScore: 94, chronicConditions: [] },
      { name: 'William Blake', email: 'will.b@test.com', bloodGroup: 'O+', gender: 'male', healthScore: 77, chronicConditions: ['Hypothyroidism'] },
      { name: 'Zoe Morgan', email: 'zoe.m@test.com', bloodGroup: 'A+', gender: 'female', healthScore: 86, chronicConditions: [] },
      { name: 'Lucas Scott', email: 'lucas.s@test.com', bloodGroup: 'B-', gender: 'male', healthScore: 73, chronicConditions: ['Hypertension'] },
      { name: 'Lily Adams', email: 'lily.a@test.com', bloodGroup: 'O+', gender: 'female', healthScore: 91, chronicConditions: [] }
    ].map((p, i) => ({
      ...p,
      password: 'demo_password123',
      role: 'patient',
      phone: `+1 555-01${i.toString().padStart(2, '0')}` // Give unique phone numbers
    }));

    await User.insertMany([...doctors, ...patients]);
    
    // ─── TTL Index Demonstration ───
    // Let's create an Access Code for the first patient that automatically
    // expires (deletes itself from DB) exactly 2 minutes from now.
    const firstPatient = await User.findOne({ email: 'james.walker@test.com' });
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 2); // 2 minutes from now

    await AccessCode.create({
      patient: firstPatient._id,
      code: 'DEMO1234',
      expiresAt: expires
    });

    console.log(`✅ Database successfully seeded!`);
    console.log(`👨‍⚕️ ${doctors.length} Doctors created. (e.g. dr.chen@cureconnect.com)`);
    console.log(`🫀 ${patients.length} Patients created. (e.g. james.walker@test.com)`);
    console.log(`🔑 All accounts use password: demo_password123`);
    console.log(`⏳ TTL INDEX ALERT: A temporary AccessCode ('DEMO1234') was generated. It will self-destruct from the DB in exactly 2 minutes! Check compass quickly!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
