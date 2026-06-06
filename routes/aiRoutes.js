const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, aiController.chatWithAI);
router.post('/analyze-food', protect, aiController.analyzeFoodImage);

module.exports = router;
