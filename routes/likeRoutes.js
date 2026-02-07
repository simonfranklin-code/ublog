const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { ensureAuthenticated, ensurePermission } = require('../middleware/permissionMiddleware');

// Routes for liking/unliking posts
router.post('/likePost', ensureAuthenticated, ensurePermission('like_posts'), likeController.likePost);
router.post('/unlikePost', ensureAuthenticated, ensurePermission('unlike_posts'), likeController.unlikePost);

// Routes for liking/unliking comments
router.post('/likeComment', ensureAuthenticated, ensurePermission('like_comments'), likeController.likeComment);
router.post('/unlikeComment', ensureAuthenticated, ensurePermission('unlike_comments'), likeController.unlikeComment);

router.post('/getCommentLikesCount', ensureAuthenticated, ensurePermission('like_comments'), likeController.getCommentLikesCount);
router.post('/getCommentLikesCountForUser', ensureAuthenticated, likeController.getCommentLikesCountForUser);
module.exports = router;
