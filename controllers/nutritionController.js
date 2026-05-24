const Nutrition = require('../models/Nutrition');
const Water = require('../models/Water');

// Helper to get start and end of "today"
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get food logs and water total for today
// @route   GET /api/nutrition/today
// @access  Private
const getTodayNutrition = async (req, res) => {
  const { start, end } = getTodayRange();

  try {
    // Find today's food logs
    const foods = await Nutrition.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });

    // Find today's water logs and sum them
    const waterLogs = await Water.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });

    const waterTotalMl = waterLogs.reduce((total, log) => total + log.amountMl, 0);

    res.status(200).json({
      success: true,
      nutrition: {
        foods,
        waterTotalMl,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching today\'s nutrition data' });
  }
};

// @desc    Log a food meal or item
// @route   POST /api/nutrition/food
// @access  Private
const logFood = async (req, res) => {
  const { mealType, foodItem, calories, protein, carbs, fat } = req.body;

  try {
    if (!mealType || !foodItem || calories === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please add meal type, food item name, and calorie count',
      });
    }

    const food = await Nutrition.create({
      user: req.user.id,
      mealType,
      foodItem,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
    });

    res.status(201).json({
      success: true,
      food,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error logging food' });
  }
};

// @desc    Log water intake
// @route   POST /api/nutrition/water
// @access  Private
const logWater = async (req, res) => {
  const { amountMl } = req.body;

  try {
    if (!amountMl || amountMl <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please add a valid water volume in mL',
      });
    }

    // Record new water entry
    await Water.create({
      user: req.user.id,
      amountMl,
    });

    // Calculate updated daily total
    const { start, end } = getTodayRange();
    const waterLogs = await Water.find({
      user: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    });

    const newWaterTotalMl = waterLogs.reduce((total, log) => total + log.amountMl, 0);

    res.status(200).json({
      success: true,
      newWaterTotalMl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error logging hydration' });
  }
};

module.exports = {
  getTodayNutrition,
  logFood,
  logWater,
};
