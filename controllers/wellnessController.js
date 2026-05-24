const Wellness = require('../models/Wellness');

// @desc    Get user's wellness history
// @route   GET /api/wellness/history
// @access  Private
const getWellnessHistory = async (req, res) => {
  try {
    const logs = await Wellness.find({ user: req.user.id }).sort({ loggedAt: -1 });

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching wellness logs' });
  }
};

// @desc    Log a new wellness / recovery entry
// @route   POST /api/wellness/log
// @access  Private
const logWellness = async (req, res) => {
  const { sleepDurationMin, sleepQuality, moodEmoji, moodNote, mindfulnessDurationMin } = req.body;

  try {
    if (sleepDurationMin === undefined || !moodEmoji) {
      return res.status(400).json({
        success: false,
        error: 'Please provide sleep duration and a mood emoji',
      });
    }

    const log = await Wellness.create({
      user: req.user.id,
      sleepDurationMin,
      sleepQuality: sleepQuality || 'Restful',
      moodEmoji,
      moodNote: moodNote || '',
      mindfulnessDurationMin: mindfulnessDurationMin || 0,
    });

    res.status(201).json({
      success: true,
      log,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error logging wellness data' });
  }
};

module.exports = {
  getWellnessHistory,
  logWellness,
};
