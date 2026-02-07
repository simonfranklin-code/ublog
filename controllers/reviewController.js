const Review = require('../models/Review');
const NotificationStats = require('../models/NotificationStats');

exports.addReview = async (req, res) => {
    const { Slug, Rating, Author, ReviewText, AuthorEmailAddress } = req.body;
    const UserId = req.user.id;  // Assume req.user contains the authenticated user's information
    
    try {
        const reviewId = await Review.addReview({ Slug, Rating, Author, ReviewText, AuthorEmailAddress, UserId });
        await NotificationStats.incrementStat(UserId, 'Reviews');
        res.json({ success: true, reviewId });
    } catch (err) {
        Review.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getReviewsByPostId = async (req, res) => {
    const { postId } = req.params;

    try {
        const reviews = await Review.getReviewsByPostId(postId);
        res.json({ success: true, reviews });
    } catch (err) {
        Review.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getReviewsBySlug = async (req, res) => {
    const slug = req.params.slug;

    try {
        
        const reviews = await Review.getReviewsBySlug(slug);
        res.json({ success: true, reviews });
    } catch (err) {
        Review.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateReview = async (req, res) => {
    const { BlogPostReviewId, Rating, Author, ReviewText, AuthorEmailAddress } = req.body;

    try {
        const changes = await Review.updateReview({ BlogPostReviewId, Rating, Author, ReviewText, AuthorEmailAddress });
        if (changes > 0) {
            res.json({ success: true, message: 'Review updated' });
        } else {
            res.status(404).json({ success: false, message: 'Review not found' });
        }
    } catch (err) {
        Review.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deleteReview = async (req, res) => {
    const { reviewId } = req.params;

    try {
        const changes = await Review.deleteReview(reviewId);
        if (changes > 0) {
            res.json({ success: true, message: 'Review deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Review not found' });
        }
    } catch (err) {
        Review.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

