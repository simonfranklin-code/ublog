const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { ensureAuthenticated } = require('../middleware/permissionMiddleware');

// Get timeline events
router.get('/', ensureAuthenticated, timelineController.getTimeline);

// Add a new event to the timeline
router.post('/event', ensureAuthenticated, timelineController.addEvent);

// Like a timeline event
router.post('/event/:id/like', ensureAuthenticated, timelineController.likeEvent);

// unlike a timeline event
router.post('/event/:id/unlike', ensureAuthenticated, timelineController.unLikeEvent);
// Add a comment to a timeline event
router.post('/event/:id/comment', ensureAuthenticated, timelineController.addComment);

module.exports = router;
