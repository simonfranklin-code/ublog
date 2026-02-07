const express = require('express');
const router = express.Router();
const addCommentReplyFormController = require('../controllers/addCommentReplyFormController');
const { validateCommentOrReply } = require('../validation/validator'); 

router.post('/', validateCommentOrReply, addCommentReplyFormController.addCommentReply);

module.exports = router;