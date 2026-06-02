const express = require('express');
const { getWellnessHistory, logWellness, deleteWellness } = require('../controllers/wellnessController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/history', protect, getWellnessHistory);
router.post('/log', protect, logWellness);
router.delete('/log/:id', protect, deleteWellness);

module.exports = router;
