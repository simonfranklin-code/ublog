// models/FriendRequest.js
const db = require('./db');

class FriendRequest {


    static createFriendRequest(requesterId, receiverId) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO friend_requests (requester_id, receiver_id) VALUES (?, ?)`,
                [requesterId, receiverId],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(this.lastID);
                }
            );
        });
    }

    static getPendingRequests(userId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT fr.id, u.username AS requester, u.avatar
                 FROM friend_requests fr 
                 JOIN users u ON u.id = fr.requester_id 
                 WHERE fr.receiver_id = ? AND fr.status = 'pending'`,
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

    static respondToRequest(requestId, status) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE friend_requests SET status = ? WHERE id = ?`,
                [status, requestId],
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }
            );
        });
    }
    static findByRequestId(requestId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM friend_requests WHERE id = ?`,
                [requestId],
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                }
            );
        });
    }

    static findByUserIds(requesterId, receiverId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM friend_requests WHERE requester_id = ? AND receiver_id = ?`,
                [requesterId, receiverId],
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                }
            );
        });
    }

    static deleteRequest(requestId) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM friend_requests WHERE id = ?`,
                [requestId],
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }
            );
        });
    }
}

module.exports = FriendRequest;


