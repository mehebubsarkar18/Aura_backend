const express = require('express');
const { getReportData, shareReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', protect, getReportData);
router.post('/share', protect, shareReport);

module.exports = router;
