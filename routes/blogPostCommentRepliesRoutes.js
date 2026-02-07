const express = require('express');
const router = express.Router();

const commentRepliesController = require('../controllers/commentRepliesController');

// Route to retrieve users
router.get('/', commentRepliesController.getReplies);

module.exports = router;