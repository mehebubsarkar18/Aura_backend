const mongoose = require('mongoose');

const WaterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amountMl: {
    type: Number,
    required: [true, 'Please add a water volume in mL'],
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Water', WaterSchema);
