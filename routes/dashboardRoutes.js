const express = require('express');
const { getTodaySummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', protect, getTodaySummary);

module.exports = router;
