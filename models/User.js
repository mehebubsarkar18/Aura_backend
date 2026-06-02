const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Prevents password from being returned in standard queries
  },
  dailyGoals: {
    calories: {
      type: Number,
      default: 2000,
    },
    caloriesBurned: {
      type: Number,
      default: 500,
    },
    activeMinutes: {
      type: Number,
      default: 45,
    },
    waterMl: {
      type: Number,
      default: 2500,
    },
    sleepMinutes: {
      type: Number,
      default: 480, // 8 hours
    },
  },
  weight: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 0,
  },
  age: {
    type: Number,
    default: 0,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: 'other',
  },
  fitnessGoal: {
    type: String,
    enum: ['lose-weight', 'maintain-fit', 'gain-muscle', ''],
    default: '',
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
