const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSocket } = require('./services/socketHandler');

dotenv.config();

const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];

const app = express();
const server = http.createServer(app);
app.get('/', (req, res) => {
  res.send('CureConnect Backend is Running 🚀');
});
// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});
initializeSocket(io);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/adherence', require('./routes/adherence'));
app.use('/api/timeline', require('./routes/timeline'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'CureConnect API is running', timestamp: new Date().toISOString() });
});

const { startCronJobs } = require('./services/cronJobs');

// MongoDB connection
const PORT = process.env.PORT || 5000;

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ Missing MONGO_URI environment variable. Create a .env file from .env.example.');
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
  .then(() => {
    console.log('✅ MongoDB connected — CureConnect DB online');
    startCronJobs(); // Initialize email reminders
    server.listen(PORT, () => {
      console.log(`🚀 CureConnect API & WebSockets running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    server.listen(PORT, () => {
      console.log(`⚠️ CureConnect API & WebSockets running on port ${PORT} (no DB)`);
    });
  });

module.exports = app;
