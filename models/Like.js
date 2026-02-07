const db = require('../models/db');
const fs = require('fs');
const NotificationStats = require('../models/NotificationStats');

// Create Likes table for blog posts if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS post_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            UNIQUE(post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES BlogPosts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Create Likes table for comments if it doesn't exist
    db.run(`
        CREATE TABLE IF NOT EXISTS comment_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comment_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            UNIQUE(comment_id, user_id),
            FOREIGN KEY (comment_id) REFERENCES Comments(CommentId) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
});
class Like {

    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

    static getLikesCountForUser(userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM comment_likes WHERE user_id = ?', [userId], (err, row) => {
                if (err) {
                    Like.logError(err);
                    return reject(err);
                }
                resolve(row.count);
            });
        });
    }

    static getCommentLikesCount(commentId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?', [commentId], (err, row) => {
                if (err) {
                    Like.logError(err);
                    return reject(err);
                }
                 resolve(row.count);
            });
        });
    }

    static likePost(postId, userId) {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], async function (err) {
                if (err) {
                    Like.logError(err);
                    return reject(err);
                }
                if (this.changes > 0) {
                    await NotificationStats.incrementStat(userId, 'Likes');
                }
                resolve(this.changes);  // Number of rows inserted
            });
        });
    }

    static unlikePost(postId, userId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], async function (err) {
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

    static async likeComment(commentId, userId) {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR IGNORE INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, userId], async function (err) {
                if (err) {
                    Like.logError(err);
                    return reject(err);
                }
                if (this.changes > 0) {
                    await NotificationStats.incrementStat(userId, 'Likes');
                }
                resolve(this.changes);  // Number of rows inserted
            });
        });
    }

    static async unlikeComment(commentId, userId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId], async function (err) {
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
}

module.exports = Like;
