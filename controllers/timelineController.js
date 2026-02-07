// controllers/timelineController.js
const TimelineEvent = require('../models/TimelineEvent');
const TimelineLike = require('../models/TimelineLike');
const TimelineComment = require('../models/TimelineComment');

exports.getTimeline = async (req, res) => {
    const userId = req.user.id;

    try {
        const events = await TimelineEvent.getTimeline(userId);

        // Fetch likes and comments for each event
        const timeline = await Promise.all(
            events.map(async (event) => {
                const likes = await TimelineLike.getLikes(event.id);
                const comments = await TimelineComment.getComments(event.id);
                return { ...event, likes, comments };
            })
        );

        res.render('user/timeline',{ title: 'Timeline Manager', timeline });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load timeline.' });
    }
};

exports.addEvent = async (req, res) => {
    const { eventType, content, metadata } = req.body;
    const userId = req.user.id;

    try {
        const eventId = await TimelineEvent.addEvent(userId, eventType, content, metadata);
        res.json({ success: true, eventId });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add event.' });
    }
};

exports.likeEvent = async (req, res) => {
    const { id } = req.params; // Event ID
    const userId = req.user.id;

    try {
        await TimelineLike.likeEvent(id, userId);
        res.json({ success: true, message: 'Event liked.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to like event.' });
    }
};

exports.unLikeEvent = async (req, res) => {
    const { id } = req.params; // Event ID
    const userId = req.user.id;

    try {
        await TimelineLike.unlikeEvent(id, userId);
        res.json({ success: true, message: 'Event Unliked.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to unlike event.' });
    }
};

exports.addComment = async (req, res) => {
    const { id } = req.params; // Event ID
    const { title, codeDescription, content, parentTimelineCommentId } = req.body;
    const userId = req.user.id;

    try {
        await TimelineComment.addComment(id, userId, title, codeDescription, content, parentTimelineCommentId );
        res.json({ success: true, message: 'Comment added.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add comment.' });
    }
};

exports.deleteComment = async (req, res) => {
    const { id } = req.params; // Comment ID
    const userId = req.user.id;

    try {
        await TimelineComment.deleteComment(id);
        res.json({ success: true, message: 'Comment added.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add comment.' });
    }
};