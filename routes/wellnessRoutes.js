const express = require('express');
const { getWellnessHistory, logWellness } = require('../controllers/wellnessController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/history', protect, getWellnessHistory);
router.post('/log', protect, logWellness);

module.exports = router;
