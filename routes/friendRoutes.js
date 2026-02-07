// routes/friends.js
const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendController');
const { ensureAuthenticated, ensureRoles, ensurePermission } = require('../middleware/permissionMiddleware');
// List friends
router.get('/', ensureAuthenticated, friendsController.listFriends);

// Send a friend request
router.post('/request', ensureAuthenticated, friendsController.sendFriendRequest);

// Remove a friend request
router.post('/remove', ensureAuthenticated, friendsController.removeFriend);

// View pending requests
router.get('/requests', ensureAuthenticated, friendsController.viewPendingRequests);

// Accept a request
router.post('/accept', ensureAuthenticated, friendsController.acceptRequest);

// Decline a request
router.post('/decline', ensureAuthenticated, friendsController.declineRequest);
router.get('/friendsDashboard', ensureAuthenticated, friendsController.friendsDashboard);
router.post('/search', ensureAuthenticated, friendsController.searchUsers);



module.exports = router;



