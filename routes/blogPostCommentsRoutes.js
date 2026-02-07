const express = require('express');
const router = express.Router();

const commentsController = require('../controllers/commentsController');

// Route to retrieve users
router.get('/', commentsController.getComments);

module.exports = router;