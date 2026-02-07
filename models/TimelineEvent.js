// models/TimelineEvent.js
const db = require('../models/db');
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS TimelineEvents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,       -- User associated with the event
            eventType TEXT NOT NULL,       -- Type of event (like, message, notification)
            content TEXT NOT NULL,         -- Text description of the event
            metadata JSON,                 -- Additional data (e.g., postId, reviewId)
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        );
    `);

});

class TimelineEvent {

    static async getTimeline(userId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM TimelineEvents WHERE userId = ? ORDER BY createdAt DESC`,
                [userId],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                }
            );
        });
    }

    static async addEvent(userId, eventType, content, metadata = null) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO TimelineEvents (userId, eventType, content, metadata) VALUES (?, ?, ?, ?)`,
                [userId, eventType, content, JSON.stringify(metadata)],
                function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID); // Return the new event ID
                }
            );
        });
    }
}

module.exports = TimelineEvent;
