// models/TimelineLike.js
const db = require('../models/db');
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS TimelineLikes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eventId INTEGER NOT NULL,      -- Timeline event ID
            userId INTEGER NOT NULL,       -- User who liked the event
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(eventId) REFERENCES TimelineEvents(id),
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

});

class TimelineLike {

    static async likeEvent(eventId, userId) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT OR IGNORE INTO TimelineLikes (eventId, userId) VALUES (?, ?)`,
                [eventId, userId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    static unlikeEvent(eventId, userId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM TimelineLikes WHERE eventId = ? AND userId = ?', [eventId, userId], async function (err) {
                if (err) {
                    Like.logError(err);
                    return reject(err);
                }
                if (this.changes > 0) {
                    await NotificationStats.incrementStat(userId, 'Likes');
                }
                resolve(this.changes);  // Number of rows deleted
            });
        });
    }
    
    static async getLikes(eventId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as likeCount FROM TimelineLikes WHERE eventId = ?`,
                [eventId],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row.likeCount);
                }
            );
        });
    }
}

module.exports = TimelineLike;
