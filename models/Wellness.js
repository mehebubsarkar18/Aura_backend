const mongoose = require('mongoose');

const WellnessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sleepDurationMin: {
    type: Number,
    required: [true, 'Please add a sleep duration in minutes'],
  },
  sleepQuality: {
    type: String,
    enum: ['Restful', 'Interrupted', 'Light'],
    default: 'Restful',
  },
  moodEmoji: {
    type: String,
    required: [true, 'Please add a mood emoji'],
    trim: true,
  },
  moodNote: {
    type: String,
    trim: true,
  },
  mindfulnessDurationMin: {
    type: Number,
    default: 0,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Wellness', WellnessSchema);
