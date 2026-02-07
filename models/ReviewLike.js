const db = require('./db');
const fs = require('fs');
const NotificationStats = require('../models/NotificationStats');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS "ReviewLikes" (
            "ReviewLikeId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "BlogPostReviewId" INTEGER NOT NULL,
            "UserId" INTEGER NOT NULL,
            UNIQUE ("BlogPostReviewId", "UserId"),
            FOREIGN KEY ("BlogPostReviewId") REFERENCES "BlogPostReviews"("BlogPostReviewId") ON DELETE CASCADE,
            FOREIGN KEY ("UserId") REFERENCES "users"("id")
        );

    `);
});

class ReviewLike {
    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

    static likeReview(BlogPostReviewId, UserId) {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR IGNORE INTO ReviewLikes (BlogPostReviewId, UserId) VALUES (?, ?)', [BlogPostReviewId, UserId], async function (err) {
                if (err) {
                    ReviewLike.logError(err);
                    return reject(err);
                }
                if (this.changes > 0) {
                    await NotificationStats.incrementStat(UserId, 'Reviews');
                }
                resolve(this.changes);  // Number of rows inserted
            });
        });
    }

    static unlikeReview(BlogPostReviewId, UserId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM ReviewLikes WHERE BlogPostReviewId = ? AND UserId = ?', [BlogPostReviewId, UserId], async function (err) {
                if (err) {
                    ReviewLike.logError(err);
                    return reject(err);
                }
                if (this.changes > 0) {
                    await NotificationStats.incrementStat(UserId, 'Reviews');
                }
                resolve(this.changes);  // Number of rows deleted
            });
        });
    }

    static getReviewLikesCount(BlogPostReviewId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM ReviewLikes WHERE BlogPostReviewId = ?', [BlogPostReviewId], (err, row) => {
                if (err) {
                    ReviewLike.logError(err);
                    return reject(err);
                }
                resolve(row.count);
            });
        });
    }
}

module.exports = ReviewLike;
