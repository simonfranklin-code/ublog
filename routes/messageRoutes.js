const express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { ensureAuthenticated } = require('../middleware/permissionMiddleware');

router.get('/history', ensureAuthenticated, messageController.getHistory);
router.post('/send', ensureAuthenticated, messageController.sendMessage);

module.exports = router;