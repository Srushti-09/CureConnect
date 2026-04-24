const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Appointment = require('./models/Appointment');
const HealthRecord = require('./models/HealthRecord');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB for seeding');

    const email = 'shinchan@gmail.com';
    await User.deleteOne({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('shinchan123', salt);

    const shinchan = await User.create({
      name: 'Shinchan Nohara',
      email,
      password: hashedPassword,
      role: 'patient',
      height: 105,
      weight: 22,
      chronicConditions: ['ckd', 'hypertension', 'uti'],
      allergies: ['Peanuts'],
      healthScore: 78
    });

    console.log(`✅ User Shinchan created with ID: ${shinchan._id}`);

    // Clean old records for him just in case (already wiped user though)
    await Appointment.deleteMany({ patient: shinchan._id });
    await HealthRecord.deleteMany({ patient: shinchan._id });

    // Seed Appointments
    const d1 = new Date(); d1.setDate(d1.getDate() - 2);
    const d2 = new Date(); d2.setDate(d2.getDate() - 10);

    // Let's get a random doctor if exists
    const Doctor = mongoose.model('User');
    const doctor = await Doctor.findOne({ role: 'doctor' });

    if (doctor) {
      await Appointment.create([
        {
          patient: shinchan._id,
          doctor: doctor._id,
          date: d1,
          time: '10:00 AM',
          type: 'in-person',
          status: 'confirmed',
          reason: 'Fever and abdominal pain'
        },
        {
          patient: shinchan._id,
          doctor: doctor._id,
          date: d2,
          time: '02:00 PM',
          type: 'video',
          status: 'completed',
          reason: 'Routine checkup for CKD'
        }
      ]);
      console.log('✅ Seeded Appointments');
    }

    // Seed Health Records
    await HealthRecord.create([
      {
        patient: shinchan._id,
        title: 'UTI_Report_April.pdf',
        fileUrl: 'data:application/pdf;base64,JVBERi...',
        fileName: 'UTI_Report_April.pdf',
        fileType: 'application/pdf',
        type: 'lab_report',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        patient: shinchan._id,
        title: 'CKD_Panel_Results.pdf',
        fileUrl: 'data:application/pdf;base64,JVBERi...',
        fileName: 'CKD_Panel_Results.pdf',
        fileType: 'application/pdf',
        type: 'lab_report',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        patient: shinchan._id,
        title: 'BP_Medication_Rx.pdf',
        fileUrl: 'data:application/pdf;base64,JVBERi...',
        fileName: 'BP_Medication_Rx.pdf',
        fileType: 'application/pdf',
        type: 'prescription',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('✅ Seeded Health Records');

    console.log('🎉 Seeding Complete!');
    process.exit(0);
  })
  .catch(console.error);
