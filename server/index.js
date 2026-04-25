const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send('CureConnect Backend is Running 🚀');
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cure-connect-iota.vercel.app',
  'https://cure-connect-iota.vercel.app/'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/symptoms', require('./routes/symptoms'));
app.use('/api/adherence', require('./routes/adherence'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'CureConnect API is running', timestamp: new Date().toISOString() });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Validate MongoDB URI is available
if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not defined!');
  console.error('   Please ensure .env file in server/ folder contains: MONGO_URI=<your_mongodb_connection_string>');
  process.exit(1);
}

// MongoDB connection configuration for traditional long-running server
const mongooseOptions = {
  maxPoolSize: 50,           // Handle concurrent requests efficiently
  minPoolSize: 10,           // Pre-warmed connections for better performance
  maxIdleTimeMS: 300000,     // 5 minutes - keep stable connections alive
  connectTimeoutMS: 10000,   // 10 second timeout for connection establishment
  socketTimeoutMS: 30000,    // 30 seconds - appropriate for OLTP operations
  serverSelectionTimeoutMS: 5000, // Quick failover for replica set issues
  retryWrites: true,         // Automatic retry for transient network errors
};

mongoose.connect(MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB connected successfully — CureConnect DB online');
    console.log(`   Connection pool: ${mongooseOptions.minPoolSize}-${mongooseOptions.maxPoolSize} connections`);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure your MongoDB URI is correct and MongoDB server is running');
    process.exit(1);
  });

// Connection event listeners for monitoring
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CureConnect API running on port ${PORT}`);
});

module.exports = app;
