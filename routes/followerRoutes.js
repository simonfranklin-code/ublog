const express = require('express');
const router = express.Router();
const followerController = require('../controllers/followerController');
const { ensureAuthenticated } = require('../middleware/permissionMiddleware');

// Route to follow a user
router.post('/follow', ensureAuthenticated, followerController.followUser);

// Route to unfollow a user
router.post('/unfollow', ensureAuthenticated, followerController.unfollowUser);

// Route to get followers
router.get('/getfollowers', ensureAuthenticated, followerController.getFollowers);

// Route to get following
router.get('/following', ensureAuthenticated, followerController.getFollowing);

// Route to get following
router.get('/followersDashboard', ensureAuthenticated, followerController.getFollowersDashboard);

module.exports = router;
