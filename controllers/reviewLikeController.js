const ReviewLike = require('../models/ReviewLike');
const NotificationStats = require('../models/NotificationStats');

exports.likeReview = async (req, res) => {
    const { BlogPostReviewId } = req.body;
    const UserId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        await ReviewLike.likeReview(BlogPostReviewId, UserId);
        //await NotificationStats.incrementStat(UserId, 'Review liked');
        const likesCount = await ReviewLike.getReviewLikesCount(BlogPostReviewId);
        res.json({ success: true, likesCount });
    } catch (err) {
        ReviewLike.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.unlikeReview = async (req, res) => {
    const { BlogPostReviewId } = req.body;
    const UserId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        await ReviewLike.unlikeReview(BlogPostReviewId, UserId);
        //await NotificationStats.incrementStat(UserId, 'Review unliked');
        const likesCount = await ReviewLike.getReviewLikesCount(BlogPostReviewId);
        res.json({ success: true, likesCount });
    } catch (err) {
        ReviewLike.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
