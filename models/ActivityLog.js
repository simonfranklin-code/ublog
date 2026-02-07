const db = require('../models/db');

// Create ActivityLog table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);
});

class ActivityLog {
    static log(userId, action, entityType, entityId = null, details = null) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
                [userId, action, entityType, entityId, details],
                function (err) {
                    if (err) {
                        return reject(new Error('Failed to log activity'));
                    }
                    resolve({ id: this.lastID, userId, action, entityType, entityId, details });
                }
            );
        });
    }

    static findAll({ page = 1, limit = 10, filters = {}, sort = {} } = {}) {
        const offset = (page - 1) * limit;
        const { userId, action, entityType, startDate, endDate, keyword } = filters;
        let query = 'SELECT * FROM activity_logs WHERE 1=1';
        const params = [];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        if (action) {
            query += ' AND action LIKE ?';
            params.push(`%${action}%`);
        }

        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType);
        }

        if (startDate) {
            query += ' AND timestamp >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND timestamp <= ?';
            params.push(endDate);
        }

        if (keyword) {
            query += ' AND (details LIKE ? OR action LIKE ? OR entity_type LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        if (sort.field) {
            query += ` ORDER BY ${sort.field} ${sort.order}`;
        } else {
            query += ' ORDER BY timestamp DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) {
                    return reject(new Error('Failed to retrieve activity logs'));
                }
                resolve(rows);
            });
        });
    }

    static countAll({ filters = {} } = {}) {
        const { userId, action, entityType, startDate, endDate, keyword } = filters;
        let query = 'SELECT COUNT(*) AS count FROM activity_logs WHERE 1=1';
        const params = [];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        if (action) {
            query += ' AND action LIKE ?';
            params.push(`%${action}%`);
        }

        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType);
        }

        if (startDate) {
            query += ' AND timestamp >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND timestamp <= ?';
            params.push(endDate);
        }

        if (keyword) {
            query += ' AND (details LIKE ? OR action LIKE ? OR entity_type LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        return new Promise((resolve, reject) => {
            db.get(query, params, (err, row) => {
                if (err) {
                    return reject(new Error('Failed to count activity logs'));
                }
                resolve(row.count);
            });
        });
    }
}

module.exports = ActivityLog;
