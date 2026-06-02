const mongoose = require('mongoose');

const WeightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weight: {
    type: Number,
    required: [true, 'Please add a weight value'],
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Weight', WeightSchema);
