const express = require('express');
const router = express.Router();
const reviewLikeController = require('../controllers/reviewLikeController');
const { ensureAuthenticated, ensurePermission } = require('../middleware/permissionMiddleware');

// Route to like a review
router.post('/likeReview', ensureAuthenticated, ensurePermission('like_reviews'), reviewLikeController.likeReview);

// Route to unlike a review
router.post('/unlikeReview', ensureAuthenticated, ensurePermission('unlike_reviews'), reviewLikeController.unlikeReview);

module.exports = router;
