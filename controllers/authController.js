const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Rating = require('../models/Rating');
const Weight = require('../models/Weight');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'aurafit_jwt_secret_token_1234',
    { expiresIn: '30d' }
  );
};

// Helper to calculate scientific daily goals
const calculateDailyGoals = (weight, height, age, gender, fitnessGoal) => {
  // BMR Calculation (Mifflin-St Jeor Equation)
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity Factor (Lightly active = 1.375)
  const tdee = bmr * 1.375;

  let calories = tdee;
  let activeMinutes = 45;
  let sleepMinutes = 480;

  if (fitnessGoal === 'lose-weight') {
    calories = tdee - 500;
    activeMinutes = 60;
  } else if (fitnessGoal === 'gain-muscle') {
    calories = tdee + 400;
    activeMinutes = 75;
    sleepMinutes = 510; // Extra recovery
  } else {
    // maintain-fit
    calories = tdee;
    activeMinutes = 45;
  }

  return {
    calories: Math.round(calories),
    activeMinutes,
    waterMl: Math.round(weight * 35), // 35ml per kg
    sleepMinutes,
  };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          dailyGoals: user.dailyGoals,
          onboardingCompleted: user.onboardingCompleted,
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          fitnessGoal: user.fitnessGoal,
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please add email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        dailyGoals: user.dailyGoals,
        onboardingCompleted: user.onboardingCompleted,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        fitnessGoal: user.fitnessGoal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        dailyGoals: user.dailyGoals,
        onboardingCompleted: user.onboardingCompleted,
        weight: user.weight,
        height: user.height,
        fitnessGoal: user.fitnessGoal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching user profile' });
  }
};

// @desc    Complete onboarding & set goals
// @route   POST /api/auth/onboarding
// @access  Private
const completeOnboarding = async (req, res) => {
  const { weight, height, age, gender, fitnessGoal } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Save biometrics
    user.weight = weight;
    user.height = height;
    user.age = age;
    user.gender = gender;
    user.fitnessGoal = fitnessGoal;
    user.onboardingCompleted = true;

    // Calculate goals
    const calculatedGoals = calculateDailyGoals(weight, height, age, gender, fitnessGoal);
    user.dailyGoals = calculatedGoals;

    await user.save();

    // Log initial weight in history (1 second in past to ensure order)
    await Weight.create({
      user: user._id,
      weight,
      loggedAt: new Date(Date.now() - 1000)
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        dailyGoals: user.dailyGoals,
        onboardingCompleted: user.onboardingCompleted,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        fitnessGoal: user.fitnessGoal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error during onboarding' });
  }
};

// @desc    Update daily goals
// @route   PUT /api/auth/goals
// @access  Private
const updateGoals = async (req, res) => {
  const { calories, activeMinutes, waterMl, sleepMinutes } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update goals fields if provided
    if (calories !== undefined) user.dailyGoals.calories = calories;
    if (activeMinutes !== undefined) user.dailyGoals.activeMinutes = activeMinutes;
    if (waterMl !== undefined) user.dailyGoals.waterMl = waterMl;
    if (sleepMinutes !== undefined) user.dailyGoals.sleepMinutes = sleepMinutes;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        dailyGoals: user.dailyGoals,
        onboardingCompleted: user.onboardingCompleted,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        fitnessGoal: user.fitnessGoal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error updating goals' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  console.log(`Password change attempt for user: ${req.user.id}`);

  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      console.log('User not found during password change');
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error changing password' });
  }
};

const getStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    console.log(`[Stats API] Current User Count: ${total}`);
    
    // Calculate average rating
    const ratings = await Rating.find();
    const avgRating = ratings.length > 0 
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : '4.9'; // Fallback if no ratings yet
    
    res.status(200).json({ 
      success: true, 
      total, 
      avgRating
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const submitRating = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Invalid rating' });
    }
    
    await Rating.create({ rating, userIp: req.ip });
    res.status(201).json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  completeOnboarding,
  updateGoals,
  changePassword,
  getStats,
  submitRating,
};
