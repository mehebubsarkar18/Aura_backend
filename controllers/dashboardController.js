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

// @desc    Get dashboard metrics summary for a specific date
// @route   GET /api/dashboard/summary
// @access  Private
const getTodaySummary = async (req, res) => {
  const { date } = req.query;
  let start, end;

  if (date) {
    start = new Date(date);
    start.setHours(0, 0, 0, 0);
    end = new Date(date);
    end.setHours(23, 59, 59, 999);
  } else {
    const range = getTodayRange();
    start = range.start;
    end = range.end;
  }

  try {
    // 1. Sum food calories consumed today
    const foodLogs = await Nutrition.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });
    const caloriesConsumed = foodLogs.reduce((total, item) => total + item.calories, 0);
    const protein = foodLogs.reduce((total, item) => total + (item.protein || 0), 0);
    const carbs = foodLogs.reduce((total, item) => total + (item.carbs || 0), 0);
    const fat = foodLogs.reduce((total, item) => total + (item.fat || 0), 0);

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
    const moodEmoji = wellnessLogs.length > 0 ? wellnessLogs[wellnessLogs.length - 1].moodEmoji : null;

    // Since steps are simulated on the client or set, let's estimate steps from calories burned or just fetch a virtual step counter
    // Let's assume a conversion factor or return a static mock-active step that defaults to goals, or allow step updates. 
    // For now, let's calculate active steps: 1 calorie burned approx. 20 steps, or 5000 standard baseline + calories Burned * 15.
    const stepsWalked = Math.floor(caloriesBurned * 15 + (activeMinutes > 0 ? 3000 : 0));

    res.status(200).json({
      success: true,
      date: date || new Date().toISOString().split('T')[0],
      summary: {
        caloriesConsumed,
        protein,
        carbs,
        fat,
        caloriesBurned,
        waterConsumedMl,
        stepsWalked,
        sleepMinutes,
        activeMinutes,
        mindfulnessMinutes,
        moodEmoji
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching dashboard summaries' });
  }
};

// @desc    Get weekly trends (past 7 days)
// @route   GET /api/dashboard/history
// @access  Private
const getHistoryAggregates = async (req, res) => {
  try {
    const history = [];
    // Loop through past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      // Fetch metrics for this specific day
      const workouts = await Workout.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } });
      const nutrition = await Nutrition.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } });
      const water = await Water.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } });
      const wellness = await Wellness.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } });

      const dayLabel = date.toLocaleDateString([], { weekday: 'short' });
      
      history.push({
        day: dayLabel,
        date: date.toISOString().split('T')[0],
        activeMinutes: workouts.reduce((s, w) => s + w.durationMinutes, 0),
        caloriesBurned: workouts.reduce((s, w) => s + w.caloriesBurned, 0),
        caloriesConsumed: nutrition.reduce((s, n) => s + n.calories, 0),
        waterMl: water.reduce((s, n) => s + n.amountMl, 0),
        sleepMinutes: wellness.reduce((s, w) => s + w.sleepDurationMin, 0),
        mindfulnessMinutes: wellness.reduce((s, w) => s + w.mindfulnessDurationMin, 0),
        moodEmoji: wellness.length > 0 ? wellness[wellness.length - 1].moodEmoji : null
      });
    }

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching historical aggregates' });
  }
};

module.exports = {
  getTodaySummary,
  getHistoryAggregates,
};

