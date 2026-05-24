const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: true,
  },
  weightKg: {
    type: Number,
    required: true,
  },
});

const ExerciseCompletedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sets: [SetSchema],
});

const WorkoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  routineName: {
    type: String,
    required: [true, 'Please add a routine name'],
    trim: true,
  },
  exercisesCompleted: [ExerciseCompletedSchema],
  durationMinutes: {
    type: Number,
    required: [true, 'Please add a duration in minutes'],
  },
  caloriesBurned: {
    type: Number,
    default: 0,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Workout', WorkoutSchema);
