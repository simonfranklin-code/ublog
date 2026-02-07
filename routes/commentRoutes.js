/*
commentRoutes.js
*/


const express = require('express');
const router = express.Router();

const commentsController = require('../controllers/commentsController');
const { ensureAuthenticated, ensurePermission } = require('../middleware/permissionMiddleware');
const { validateCommentOrReply } = require('../validation/validator');

router.post('/addCommentReply', validateCommentOrReply, ensureAuthenticated, ensurePermission('add_comments'), commentsController.addCommentReply);
router.get('/getComment/:commentId', ensureAuthenticated, ensurePermission('get_comments'), commentsController.getComment);

router.put('/updateCommentReply', validateCommentOrReply, ensureAuthenticated, ensurePermission('update_comments'), commentsController.updateCommentReply);
router.get('/getReplies/:slug/:commentId', commentsController.getReplies);
router.get('/getRepliesJSON/:slug/:commentId', commentsController.getRepliesJSON);
router.get('/getComments/:slug', commentsController.getComments);
router.get('/deleteComment/:commentId', ensureAuthenticated, ensurePermission('delete_comments'), commentsController.deleteComment);
//router.get('/deleteReplies/:slug/:parentCommentId', ensureAuthenticated, ensurePermission('delete_comments'), commentsController.deleteReplies);
module.exports = router;



