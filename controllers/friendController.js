// controllers/friendController.js
const friendModel = require('../models/Friend');
const friendRequestModel = require('../models/FriendRequest');
const User = require('../models/User');



exports.listFriends = async (req, res) => {
    const userId = req.user.id; // Assuming user is authenticated and req.user exists
    try {
        const friends = await friendModel.getFriends(userId);
        res.json({friends: friends });
    } catch (error) {
        res.status(500).send('Error retrieving friends');
    }
};

exports.sendFriendRequest = async (req, res) => {
    const requesterId = req.user.id;
    const { receiverId } = req.body;
    try {
        await friendRequestModel.createFriendRequest(requesterId, receiverId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).send('Error sending friend request');
    }
};

exports.removeFriend = async (req, res) => {

    const userId = req.user.id;
    const { friendId } = req.body;
    try {
        await friendModel.removeFriend(userId, friendId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).send('Error removing friend');
    }
};

exports.acceptRequest = async (req, res) => {
    
    try {
        const { reqId } = req.body;
        await friendRequestModel.respondToRequest(reqId, 'accepted');
        const request = await friendRequestModel.findByRequestId(reqId);
        await friendModel.addFriend(req.user.id, request.requester_id);
        res.json({ success: true })
    } catch (error) {
        res.status(500).send('Error accepting request');
    }
};

exports.declineRequest = async (req, res) => {
    const requestId = req.body.requestId;
    try {
        await friendRequestModel.respondToRequest(requestId, 'declined');
        res.redirect('/friends/friendsDashboard');
    } catch (error) {
        res.status(500).send('Error declining request');
    }
};

exports.friendsDashboard = async (req, res) => {
    try {
        // Render the 'admin/friends' Pug template
        const friends = await friendModel.getFriends(req.user.id);
        const pendingRequests = await friendRequestModel.getPendingRequests(req.user.id);

        res.render(`${req.user.role === 'admin' ? 'user' : 'user'}/friends`, {
            title: 'Friends Management',
            user: req.user, // Pass user information if needed
            friends: friends,
            pendingRequests: pendingRequests,
        });
    } catch (error) {
        console.error('Error rendering the friends dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.viewPendingRequests = async (req, res) => {
    try {

        const pendingRequests = await friendRequestModel.getPendingRequests(req.user.id);

        res.json({
            pendingRequests: pendingRequests,
        });
    } catch (error) {
        console.error('Error rendering the friends dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.searchUsers = async (req, res) => {
    const { search } = req.body;
    try {
        // Find users by partial match on username or email
        const users = await User.searchByUsernameOrEmail(search);

        // Send the list of matched users back as JSON for the frontend to handle
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Error searching for users' });
    }
};

