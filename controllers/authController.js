const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Rating = require('../models/Rating');
const Weight = require('../models/Weight');

// Helper function to generate Access Token (short-lived)
const generateAccessToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );
};

// Helper function to generate Refresh Token (long-lived)
const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to send tokens
const sendTokens = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token: accessToken,
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
};

const calculateDailyGoals = (weight, height, age, gender, fitnessGoal) => {
  // BMR Calculation (Mifflin-St Jeor)
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  }

  // Activity Factor (Assuming light exercise: 1.375)
  let calories = bmr * 1.375;

  // Fitness Goal adjustment
  if (fitnessGoal === 'lose-weight') calories -= 500;
  if (fitnessGoal === 'gain-muscle') calories += 400;

  return {
    calories: Math.max(1200, Math.round(calories)),
    caloriesBurned: 400,
    activeMinutes: 45,
    waterMl: Math.round(weight * 33), // 33ml per kg
    sleepMinutes: 480
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
      sendTokens(user, 201, res);
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

    sendTokens(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error during login' });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const accessToken = generateAccessToken(user._id);
    res.status(200).json({ success: true, token: accessToken });
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
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

// @desc    Update user profile biometrics
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  const { weight, height, age, gender, fitnessGoal } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const weightChanged = weight !== undefined && weight !== user.weight;

    // Update fields if provided
    if (weight !== undefined) user.weight = weight;
    if (height !== undefined) user.height = height;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (fitnessGoal !== undefined) user.fitnessGoal = fitnessGoal;

    // Recalculate goals based on new biometrics
    const calculatedGoals = calculateDailyGoals(
      user.weight,
      user.height,
      user.age,
      user.gender,
      user.fitnessGoal
    );
    user.dailyGoals = calculatedGoals;

    await user.save();

    // If weight changed, log it in history
    if (weightChanged) {
      await Weight.create({
        user: user._id,
        weight: user.weight,
      });
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
        age: user.age,
        gender: user.gender,
        fitnessGoal: user.fitnessGoal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error updating profile' });
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
  refreshToken,
  logoutUser,
  getMe,
  completeOnboarding,
  updateGoals,
  changePassword,
  getStats,
  submitRating,
};
