const express = require('express');
const { getWorkoutHistory, logWorkout } = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/history', protect, getWorkoutHistory);
router.post('/log', protect, logWorkout);

module.exports = router;
