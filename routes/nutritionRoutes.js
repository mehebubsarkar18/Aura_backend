const express = require('express');
const {
  getTodayNutrition,
  logFood,
  logWater,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/today', protect, getTodayNutrition);
router.post('/food', protect, logFood);
router.post('/water', protect, logWater);

module.exports = router;
