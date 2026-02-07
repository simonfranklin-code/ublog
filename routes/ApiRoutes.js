const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { clearChatLimiter } = require('../middleware/rateLimiter');
const { ensureAuthenticated, ensureRole, ensureRoles, ensurePermission } = require('../middleware/permissionMiddleware');

router.get('/deepseekDashboard', ensureAuthenticated, ensureRoles('admin'), apiController.deepseekDashboard);
router.post('/deepseek/createCompletion', ensureAuthenticated, ensureRoles(['admin']), apiController.createCompletion);
router.post('/deepseek/chatHistory', ensureAuthenticated, ensureRoles(['admin']), apiController.getDeepseekChatHistory);
router.post('/deepseek/clearChatHistory', ensureAuthenticated, ensureRoles(['admin']), clearChatLimiter, apiController.clearDeepseekChatHistory);
router.post('/deepseek/saveChat', ensureAuthenticated, ensureRoles(['admin']), clearChatLimiter, apiController.saveChat);
router.get('/deepseek/listSavedChats', ensureAuthenticated, ensureRoles(['admin']), clearChatLimiter, apiController.listSavedChats);
router.post('/deepseek/deleteSavedChat', ensureAuthenticated, ensureRoles(['admin']), apiController.deleteSavedChat);

module.exports = router;