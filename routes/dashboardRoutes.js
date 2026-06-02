const express = require('express');
const { getTodaySummary, getHistoryAggregates } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', protect, getTodaySummary);
router.get('/history', protect, getHistoryAggregates);

module.exports = router;
