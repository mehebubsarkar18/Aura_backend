const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  completeOnboarding,
  updateGoals,
  changePassword,
  getStats,
  submitRating,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/stats', getStats);
router.post('/rating', protect, submitRating);
router.get('/heartbeat', (req, res) => res.json({ success: true, message: 'Auth routes reachable' }));
router.post('/onboarding', protect, completeOnboarding);
router.put('/goals', protect, updateGoals);
router.put('/password', protect, changePassword);

module.exports = router;
