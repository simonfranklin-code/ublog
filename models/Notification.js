const db = require('../models/db');
const fs = require('fs');

db.serialize(() => {
    db.run(`
            CREATE TABLE IF NOT EXISTS "Notifications" (
                "NotificationId" INTEGER PRIMARY KEY AUTOINCREMENT,
                "UserId" INTEGER NOT NULL,
                "Message" TEXT NOT NULL,
                "CreatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
                "Read" BOOLEAN DEFAULT FALSE,
                FOREIGN KEY ("UserId") REFERENCES "users"("id")
            );

    `);
});


class Notification {
    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

    static createNotification(UserId, Message, io) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO Notifications (UserId, Message)
             VALUES (?, ?)`,
                [UserId, Message],
                function (err) {
                    if (err) {
                        Notification.logError(err);
                        return reject(err);
                    }
                    // Emit real-time event
                    //io.emit('newNotification', { NotificationId: this.lastID, UserId, Message });
                    resolve(this.lastID);
                }
            );
        });
    }


    static getNotifications(UserId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM Notifications WHERE UserId = ? ORDER BY CreatedAt DESC`,
                [UserId],
                (err, rows) => {
                    if (err) {
                        Notification.logError(err);
                        return reject(err);
                    }
                    resolve(rows);
                }
            );
        });
    }

    static markAsRead(NotificationId) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE Notifications SET Read = 1 WHERE NotificationId = ?`,
                [NotificationId],
                function (err) {
                    if (err) {
                        Notification.logError(err);
                        return reject(err);
                    }
                    resolve(this.changes);  // Number of rows updated
                }
            );
        });
    }
}

module.exports = Notification;
