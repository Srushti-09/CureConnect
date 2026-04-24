const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminder } = require('./emailService');

const startCronJobs = () => {
  // Run every hour to check for upcoming appointments within the next 24 hours
  cron.schedule('0 * * * *', async () => {
    console.log('Running cron job to check for upcoming appointments...');
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find pending/confirmed appointments in the next 24 hours that haven't been reminded
      const upcomingAppointments = await Appointment.find({
        date: { $gte: now, $lte: tomorrow },
        status: { $in: ['pending', 'confirmed'] },
        reminded: false
      }).populate('patient doctor');

      for (const apt of upcomingAppointments) {
        if (apt.patient && apt.patient.email) {
          // Send Email Request
          const success = await sendAppointmentReminder(
            apt.patient.email,
            apt.patient.name,
            apt.doctor ? apt.doctor.name : 'Doctor',
            apt.date.toDateString(),
            apt.time
          );

          // Update flag so we don't send it again
          if (success) {
            apt.reminded = true;
            await apt.save();
          }
        }
      }
      if (upcomingAppointments.length > 0) {
        console.log(`Processed ${upcomingAppointments.length} email reminders.`);
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });

  console.log('✅ Cron jobs initialized.');
};

module.exports = { startCronJobs };
