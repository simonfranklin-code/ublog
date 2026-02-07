const Like = require('../models/Like');
const Notification = require('../models/Notification');
const Follower = require('../models/Follower');
const User = require('../models/User');
const Comment = require('../models/Comment');

exports.likePost = async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        await Like.likePost(postId, userId);
        res.json({ success: true, message: 'Post liked' });
    } catch (err) {
        Like.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.unlikePost = async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        await Like.unlikePost(postId, userId);
        res.json({ success: true, message: 'Post unliked' });
    } catch (err) {
        Like.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.likeComment = async (req, res) => {
    const { commentId } = req.body;
    const currentUserId = req.user.id;  // Assume req.user contains the authenticated user's information
    const _user = await User.findById(currentUserId);
    const currentUsername = _user.username;
    const comment = await Comment.getCommentById(commentId);
    const commentUserId = comment.UserId;
    const commentUser = await User.findById(commentUserId);
    const commentUsername = commentUser.username
    try {
        await Like.likeComment(commentId, currentUserId);
        const likesCount = await Like.getCommentLikesCount(commentId);
        await Notification.createNotification(currentUserId, `User ${currentUsername} liked User ${commentUsername}'s comment`, req.io);
        // Notify followers
        const followers = await Follower.getFollowers(req.user.id);
        followers.forEach(async follower => {
            await Notification.createNotification(follower.FollowerUserId, `User ${currentUsername} liked User ${commentUsername}'s comment`, req.io);
        });
        res.json({ success: true, message: 'Comment liked', likesCount: likesCount });
    } catch (err) {
        Like.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.unlikeComment = async (req, res) => {
    const { commentId } = req.body;
    const userId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        await Like.unlikeComment(commentId, userId);
        const likesCount = await Like.getCommentLikesCount(commentId);
        res.json({ success: true, message: 'Comment unliked', likesCount: likesCount });
    } catch (err) {
        Like.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getCommentLikesCount = async (req, res) => {
    const { commentId } = req.body;
    try {
        const likesCount = await Like.getCommentLikesCount(commentId);
        res.json({ likesCount: likesCount });
    } catch (err) {
        Like.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getCommentLikesCountForUser = async (req, res) => {
    const { userId } = req.body;
    try {
        const likesCount = await Like.getLikesCountForUser(userId);
        res.json({ likesCount: likesCount });
    } catch (err) {
        Like.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};