const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSocket } = require('./services/socketHandler');
const { startCronJobs } = require('./services/cronJobs');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware - CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cure-connect-iota.vercel.app',
  'https://cure-connect-iota.vercel.app/',
  process.env.FRONTEND_URL
].filter(Boolean); // Remote null/undefined

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed or matches a pattern
    const isAllowed = allowedOrigins.some(o => 
      o === origin || 
      o === origin.replace(/\/$/, '')
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});
initializeSocket(io);

// Standard Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Route
app.get('/', (req, res) => {
  res.send('CureConnect Backend with WebSockets is Running 🚀');
});

// Routes - Combined from both versions
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/symptoms', require('./routes/symptoms'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/adherence', require('./routes/adherence'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'CureConnect API is running', timestamp: new Date().toISOString() });
});

// MongoDB Connection Configuration
const mongooseOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 300000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
};

// Validate MongoDB URI
if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not defined!');
  console.error('   Please ensure .env file in server/ folder contains: MONGO_URI=<your_mongodb_connection_string>');
  // Don't exit here, let it try to connect or handle gracefully below
} else {
  mongoose.connect(MONGO_URI, mongooseOptions)
    .then(() => {
      console.log('✅ MongoDB connected successfully — CureConnect DB online');
      startCronJobs(); // Initialize email reminders
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.warn('⚠️ Server starting without database connection');
    });
}

// Connection event listeners
mongoose.connection.on('disconnected', () => console.warn('⚠️ Mongoose disconnected'));
mongoose.connection.on('error', (err) => console.error('❌ Mongoose error:', err.message));

// Start server
server.listen(PORT, () => {
  console.log(`🚀 CureConnect API & WebSockets running on port ${PORT}`);
});

module.exports = app;
