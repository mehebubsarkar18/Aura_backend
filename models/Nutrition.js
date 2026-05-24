const mongoose = require('mongoose');

const NutritionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mealType: {
    type: String,
    required: [true, 'Please add a meal type'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
  },
  foodItem: {
    type: String,
    required: [true, 'Please add a food item name'],
    trim: true,
  },
  calories: {
    type: Number,
    required: [true, 'Please add a calorie count'],
  },
  protein: {
    type: Number,
    default: 0,
  },
  carbs: {
    type: Number,
    default: 0,
  },
  fat: {
    type: Number,
    default: 0,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Nutrition', NutritionSchema);
