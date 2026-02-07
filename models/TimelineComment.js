// models/TimelineComment.js
const db = require('../models/db');
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS TimelineComments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eventId INTEGER NOT NULL,      -- Timeline event ID
            userId INTEGER NOT NULL,       -- User who made the comment
            title	TEXT,
	        codeDescription	TEXT,
            content TEXT NOT NULL,         -- Comment text
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            parentTimelineCommentId	INTEGER,
            FOREIGN KEY(eventId) REFERENCES TimelineEvents(id),
            FOREIGN KEY(userId) REFERENCES users(id)
        );
    `);

});


class TimelineComment {
    static async addComment(eventId, userId, title, codeDescription, content, parentTimelineCommentId) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO TimelineComments (eventId, userId, title, codeDescription, content, parentTimelineCommentId) VALUES (?, ?, ?, ?, ?, ?)`,
                [eventId, userId, title, codeDescription, content, parentTimelineCommentId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    static async deleteComment(commentId) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM TimelineComments WHERE id = ?`,
                [commentId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    static async getComments(eventId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM TimelineComments WHERE eventId = ? ORDER BY createdAt ASC`,
                [eventId],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                }
            );
        });
    }
}

module.exports = TimelineComment;
