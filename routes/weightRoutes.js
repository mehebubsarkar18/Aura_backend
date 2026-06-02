const express = require('express');
const { logWeight, getWeightHistory } = require('../controllers/weightController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/log', protect, logWeight);
router.get('/history', protect, getWeightHistory);

module.exports = router;
