const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const setupRoutes = require('./routes');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Standard Security & Utility Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for simplicity in single-deployment
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request Logger for Debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Register Module Routes
setupRoutes(app);

// Serve Static Files from Frontend in Production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../Fitness_Tracker_Frontend/dist');
  app.use(express.static(frontendPath));

  // Catch-all route for React SPA routing
  app.get('*', (req, res, next) => {
    // If it's an API route, let it pass through (though it should have been caught by setupRoutes)
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(frontendPath, 'index.html'));
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
