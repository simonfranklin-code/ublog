// models/Message.js
const db = require('./db');
const fs = require('fs');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS "Messages" (
            "MessageId" INTEGER PRIMARY KEY AUTOINCREMENT,
            "SenderId" INTEGER NOT NULL,
            "ReceiverId" INTEGER NOT NULL,
            "Content" TEXT NOT NULL,
            "CreatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("SenderId") REFERENCES "users"("id"),
            FOREIGN KEY ("ReceiverId") REFERENCES "users"("id")
        );
    `);
});

class Message {
    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

    static createMessage(SenderId, ReceiverId, Content) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO Messages (SenderId, ReceiverId, Content)
                 VALUES (?, ?, ?)`,
                [SenderId, ReceiverId, Content],
                function (err) {
                    if (err) {
                        Message.logError(err);
                        return reject(err);
                    }
                    resolve(this.lastID);
                }
            );
        });
    }

    static getConversation(SenderId, ReceiverId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM Messages
                 WHERE (SenderId = ? AND ReceiverId = ?)
                    OR (SenderId = ? AND ReceiverId = ?)
                 ORDER BY CreatedAt ASC`,
                [SenderId, ReceiverId, ReceiverId, SenderId],
                (err, rows) => {
                    if (err) {
                        Message.logError(err);
                        return reject(err);
                    }
                    resolve(rows);
                }
            );
        });
    }
}

module.exports = Message;
