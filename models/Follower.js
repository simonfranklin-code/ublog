const db = require('./db');
const fs = require('fs');

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS "Followers" (
        "FollowerId" INTEGER PRIMARY KEY AUTOINCREMENT,
        "UserId" INTEGER NOT NULL,
        "FollowerUserId" INTEGER NOT NULL,
        UNIQUE ("UserId", "FollowerUserId"),
        FOREIGN KEY ("UserId") REFERENCES "users"("id"),
        FOREIGN KEY ("FollowerUserId") REFERENCES "users"("id")
    );

    `);
});

class Follower {
    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

    static followUser(UserId, FollowerUserId) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT OR IGNORE INTO Followers (UserId, FollowerUserId)
                 VALUES (?, ?)`,
                [UserId, FollowerUserId],
                function (err) {
                    if (err) {
                        Follower.logError(err);
                        return reject(err);
                    }
                    resolve(this.lastID);  // Return the ID of the newly inserted follower
                }
            );
        });
    }

    static unfollowUser(UserId, FollowerUserId) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM Followers WHERE UserId = ? AND FollowerUserId = ?`,
                [UserId, FollowerUserId],
                function (err) {
                    if (err) {
                        Follower.logError(err);
                        return reject(err);
                    }
                    resolve(this.changes);  // Number of rows deleted
                }
            );
        });
    }

    static getFollowers(UserId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM Followers WHERE UserId = ?`,
                [UserId],
                (err, rows) => {
                    if (err) {
                        Follower.logError(err);
                        return reject(err);
                    }

                    resolve(rows);
                }
            );
        });
    }

    static getFollowing(UserId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM Followers WHERE FollowerUserId = ?`,
                [UserId],
                (err, rows) => {
                    if (err) {
                        Follower.logError(err);
                        return reject(err);
                    }
                    resolve(rows);
                }
            );
        });
    }
}

module.exports = Follower;
