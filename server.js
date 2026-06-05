const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const setupRoutes = require('./routes');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB database
connectDB();

console.log('Loaded ENV keys:', Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('URI') || k.includes('SECRET')));
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'undefined');

const app = express();

// Standard Security & Utility Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for simplicity in single-deployment
}));

// CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [] // In production, same-origin is often enough if served by express
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Request Logger for Debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Register Module Routes
setupRoutes(app);

// Serve Static Files from Frontend in Production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.resolve(__dirname, '../Fitness_Tracker_Frontend/dist');
  app.use(express.static(frontendPath));

  // SPA Fallback Middleware (Express 5 safe)
  app.use((req, res, next) => {
    // Only handle GET requests that aren't for API or static files
    if (req.method === 'GET' && !req.url.startsWith('/api') && !req.path.includes('.')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      next();
    }
  });
} else {
  // Base Check Route for Development
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'AuraFit Server REST API running smoothly',
      version: '1.0.0',
      mode: process.env.NODE_ENV || 'development'
    });
  });
}

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`AuraFit server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
