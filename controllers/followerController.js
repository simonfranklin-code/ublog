const Follower = require('../models/Follower');
const Notification = require('../models/Notification');
const User = require('../models/User');
exports.followUser = async (req, res) => {
    const { UserId } = req.body;
    const FollowerUserId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        await Follower.followUser(UserId, FollowerUserId);
        await Notification.createNotification(UserId, `You have a new follower. ${FollowerUserId}`);
        res.json({ success: true, message: 'User followed' });
    } catch (err) {
        Follower.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.unfollowUser = async (req, res) => {
    const { UserId } = req.body;
    const FollowerUserId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        await Follower.unfollowUser(UserId, FollowerUserId);
        res.json({ success: true, message: 'User unfollowed' });
    } catch (err) {
        Follower.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getFollowers = async (req, res) => {
    const UserId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        const followers = await Follower.getFollowers(UserId);

        for (const follower of followers) {
            const user = await User.findById(follower.FollowerUserId);
            follower.user = user;
        }

        res.json({ success: true, followers });
    } catch (err) {
        Follower.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getFollowing = async (req, res) => {
    const UserId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        const following = await Follower.getFollowing(UserId);

        for (const follower of following) {
            const user = await User.findById(follower.UserId);
            follower.user = user;
        }

        res.json({ success: true, following });
    } catch (err) {
        Follower.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getFollowersDashboard = async (req, res) => {
    const UserId = req.user.id;  // Assume req.user contains the authenticated user's information

    try {
        const following = await Follower.getFollowing(UserId);
        const followers = await Follower.getFollowers(UserId);
        if (req.user.role === 'admin') {
            res.render('admin/followers', { title: 'Manage Followers', following: following, followers: followers });
        } else if (req.user.role === 'user') {
            res.render('user/followers', { title: 'Manage Followers', following: following, followers: followers });
        }
    } catch (err) {
        Follower.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

