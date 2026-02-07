const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { ensureAuthenticated } = require('../middleware/permissionMiddleware');
const Notification = require('../models/Notification');


router.get('/displayNotifications', ensureAuthenticated, async (req, res) => {
    try {

        res.render('user/notifications', {  title: 'Notifications' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


// Route to get notifications for a user
router.post('/getNotifications', ensureAuthenticated, notificationController.getNotifications);

// Route to mark a notification as read
router.post('/markAsRead', ensureAuthenticated, notificationController.markAsRead);
router.post('/sendNotification', ensureAuthenticated, async (req, res) => {
    const { UserId, Message } = req.body;

    try {
        await Notification.createNotification(UserId, Message, req.io);
        res.json({ success: true, message: 'Notification sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
});
module.exports = router;
