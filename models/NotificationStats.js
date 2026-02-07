const db = require('./db');

class NotificationStats {
    static incrementStat(userId, stat) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE NotificationStats SET ${stat} = ${stat} + 1 WHERE UserId = ?`,
                [userId],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(this.changes);
                }
            );
        });
    }

    static createStats(userId) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO NotificationStats (UserId) VALUES (?)',
                [userId],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(this.lastID);
                }
            );
        });
    }
}

module.exports = NotificationStats;
