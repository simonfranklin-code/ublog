const express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();
const { ensureAuthenticated, ensurePermission } = require('../middleware/permissionMiddleware');
router.get('/', ensureAuthenticated, ensurePermission('can_chat'), chatController.getChatPage);

module.exports = router;