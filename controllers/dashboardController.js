const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Water = require('../models/Water');
const Wellness = require('../models/Wellness');

// Helper to get start and end of "today"
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get dashboard metrics summary for today
// @route   GET /api/dashboard/summary
// @access  Private
const getTodaySummary = async (req, res) => {
  const { start, end } = getTodayRange();

  try {
    // 1. Sum food calories consumed today
    const foodLogs = await Nutrition.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });
    const caloriesConsumed = foodLogs.reduce((total, item) => total + item.calories, 0);

    // 2. Sum workout duration and calories burned today
    const workoutLogs = await Workout.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });
    const caloriesBurned = workoutLogs.reduce((total, item) => total + item.caloriesBurned, 0);
    const activeMinutes = workoutLogs.reduce((total, item) => total + item.durationMinutes, 0);

    // 3. Sum hydration levels today
    const waterLogs = await Water.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });
    const waterConsumedMl = waterLogs.reduce((total, item) => total + item.amountMl, 0);

    // 4. Sum sleep duration and mindfulness today
    const wellnessLogs = await Wellness.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });
    const sleepMinutes = wellnessLogs.reduce((total, item) => total + item.sleepDurationMin, 0);
    const mindfulnessMinutes = wellnessLogs.reduce((total, item) => total + item.mindfulnessDurationMin, 0);

    // Since steps are simulated on the client or set, let's estimate steps from calories burned or just fetch a virtual step counter
    // Let's assume a conversion factor or return a static mock-active step that defaults to goals, or allow step updates. 
    // For now, let's calculate active steps: 1 calorie burned approx. 20 steps, or 5000 standard baseline + calories Burned * 15.
    const stepsWalked = Math.floor(caloriesBurned * 15 + (activeMinutes > 0 ? 3000 : 0));

    res.status(200).json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      summary: {
        caloriesConsumed,
        caloriesBurned,
        waterConsumedMl,
        stepsWalked,
        sleepMinutes,
        activeMinutes,
        mindfulnessMinutes,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching dashboard summaries' });
  }
};

module.exports = {
  getTodaySummary,
};
