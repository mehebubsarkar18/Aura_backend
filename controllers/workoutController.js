const Workout = require('../models/Workout');

// @desc    Get user's workout logs
// @route   GET /api/workouts/history
// @access  Private
const getWorkoutHistory = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).sort({ loggedAt: -1 });
    
    res.status(200).json({
      success: true,
      workouts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching workouts' });
  }
};

// @desc    Log a completed workout
// @route   POST /api/workouts/log
// @access  Private
const logWorkout = async (req, res) => {
  const { routineName, exercisesCompleted, durationMinutes, caloriesBurned } = req.body;

  try {
    if (!routineName || durationMinutes === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please add a routine name and workout duration',
      });
    }

    const workout = await Workout.create({
      user: req.user.id,
      routineName,
      exercisesCompleted: exercisesCompleted || [],
      durationMinutes,
      caloriesBurned: caloriesBurned || 0,
    });

    res.status(201).json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error logging workout' });
  }
};

module.exports = {
  getWorkoutHistory,
  logWorkout,
};
