const Weight = require('../models/Weight');
const User = require('../models/User');

// @desc    Log weight
// @route   POST /api/weight/log
// @access  Private
const logWeight = async (req, res) => {
  const { weight, date } = req.body;

  try {
    if (!weight) {
      return res.status(400).json({ success: false, error: 'Please add a weight value' });
    }

    const logDate = date ? new Date(date) : new Date();
    
    // Create weight log
    const weightLog = await Weight.create({
      user: req.user.id,
      weight,
      loggedAt: logDate,
    });

    // Also update the current weight in User model
    await User.findByIdAndUpdate(req.user.id, { weight });

    res.status(201).json({
      success: true,
      data: weightLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error logging weight' });
  }
};

// @desc    Get weight history (last 7 entries)
// @route   GET /api/weight/history
// @access  Private
const getWeightHistory = async (req, res) => {
  try {
    const history = await Weight.find({ user: req.user.id })
      .sort({ loggedAt: -1 })
      .limit(7);

    res.status(200).json({
      success: true,
      data: history.reverse(), // Return in chronological order for the graph
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching weight history' });
  }
};

module.exports = {
  logWeight,
  getWeightHistory,
};
