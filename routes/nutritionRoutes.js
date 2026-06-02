const express = require('express');
const {
  getTodayNutrition,
  getNutritionHistory,
  logFood,
  logWater,
  deleteFood,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/today', protect, getTodayNutrition);
router.get('/history', protect, getNutritionHistory);
router.post('/food', protect, logFood);
router.post('/water', protect, logWater);
router.delete('/food/:id', protect, deleteFood);

module.exports = router;
