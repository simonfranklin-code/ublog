const crypto = require('crypto');
const db = require('../models/db');

// Create PasswordResetTokens table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token TEXT NOT NULL,
            expiration DATE NOT NULL
        )
    `);
});

class PasswordResetToken {
    static create(email) {
        const token = crypto.randomBytes(20).toString('hex');
        const expiration = Date.now() + 3600000; // 1 hour
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO password_reset_tokens (email, token, expiration) VALUES (?, ?, ?)',
                [email, token, expiration],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(token);
                }
            );
        });
    }

    static findByToken(token) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM password_reset_tokens WHERE token = ? AND expiration > ?',
                [token, Date.now()],
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                }
            );
        });
    }

    static deleteByEmail(email) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM password_reset_tokens WHERE email = ?',
                [email],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }
            );
        });
    }
}

module.exports = PasswordResetToken;
