const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { ensureAuthenticated, ensurePermission } = require('../middleware/permissionMiddleware');

// Route to add a review
router.post('/addReview', ensureAuthenticated, ensurePermission('add_reviews'), reviewController.addReview);

// Route to get reviews by blog post ID
router.get('/reviews/:postId', reviewController.getReviewsByPostId);

// Route to get reviews by blog post ID
router.get('/reviewsBySlug/:slug', reviewController.getReviewsBySlug);

// Route to update a review
router.put('/updateReview', ensureAuthenticated, ensurePermission('edit_reviews'), reviewController.updateReview);

// Route to delete a review
router.delete('/deleteReview/:reviewId', ensureAuthenticated, ensurePermission('delete_reviews'), reviewController.deleteReview);

module.exports = router;