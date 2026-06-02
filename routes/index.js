const authRoutes = require('./authRoutes');
const workoutRoutes = require('./workoutRoutes');
const nutritionRoutes = require('./nutritionRoutes');
const wellnessRoutes = require('./wellnessRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const weightRoutes = require('./weightRoutes');

module.exports = (app) => {
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/nutrition', nutritionRoutes);
  app.use('/api/wellness', wellnessRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/weight', weightRoutes);
};
