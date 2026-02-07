const Notification = require('../models/Notification');
const db = require('../models/db');
exports.getNotifications = async (req, res) => {
    const UserId = req.user.id;
    const { page, filter, sortColumn, sortOrder, limit  } = req.body;
    const offset = (page - 1) * limit;

    try {
        const query = `
            SELECT * FROM Notifications
            WHERE UserId = ? AND Message LIKE ?
            ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}
            LIMIT ? OFFSET ?
        `;

        const notifications = await new Promise((resolve, reject) => {
            db.all(query, [UserId, `%${filter}%`, limit, offset], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });

        const totalNotifications = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM Notifications WHERE UserId = ? AND Message LIKE ?`, [UserId, `%${filter}%`], (err, row) => {
                if (err) return reject(err);
                resolve(row.count);
            });
        });

        res.json({
            success: true,
            notifications,
            totalPages: Math.ceil(totalNotifications / limit)
        });
    } catch (err) {
        Notification.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


exports.markAsRead = async (req, res) => {
    const { NotificationId } = req.body;

    try {
        const changes = await Notification.markAsRead(NotificationId);
        if (changes > 0) {
            res.json({ success: true, message: 'Notification marked as read' });
        } else {
            res.status(404).json({ success: false, message: 'Notification not found' });
        }
    } catch (err) {
        Notification.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
