// models/Friend.js
const db = require('./db');

class Friend {
    static getFriends(userId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT u.id, u.username, u.avatar
                 FROM friends f 
                 JOIN users u ON u.id = f.friend_id 
                 WHERE f.user_id = ?`,
                [userId],
                (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                }
            );
        });
    }

    static removeFriend(userId, friendId) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM friends 
                 WHERE (user_id = ? AND friend_id = ?) 
                    OR (user_id = ? AND friend_id = ?)`,
                [userId, friendId, friendId, userId],
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }
            );
        });
    }

    static addFriend(userId, friendId) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO friends (user_id, friend_id) VALUES (?, ?)`,
                [userId, friendId],
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }
            );
        });
    }

    static checkFriendship(userId, friendId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM friends 
                 WHERE (user_id = ? AND friend_id = ?) 
                    OR (user_id = ? AND friend_id = ?)`,
                [userId, friendId, friendId, userId],
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                }
            );
        });
    }
}

module.exports = Friend;


