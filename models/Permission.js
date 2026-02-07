const db = require('../models/db');
const fs = require('fs');

// Create Permissions table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    // Insert default permissions
    const permissions = [
        'manage_users',
        'edit_posts',
        'delete_posts',
        'add_posts',
        'add_comments',
        'reply_to_comments',
        'reply_to_replies',
        'manage_permissions',
        'create_permissions',
        'assign_permissions',
        'view_permissions'
    ];
    permissions.forEach(permission => {
        db.run(`INSERT OR IGNORE INTO permissions (name) VALUES (?)`, [permission]);
    });
});

// Create RolePermissions table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS role_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            permission_id INTEGER NOT NULL,
            UNIQUE(role, permission_id),  -- Add unique constraint
            FOREIGN KEY (permission_id) REFERENCES permissions (id)
        )
    `);

    // Assign default permissions to roles
    const rolePermissions = [
        { role: 'admin', permission: 'manage_users' },
        { role: 'admin', permission: 'edit_posts' },
        { role: 'admin', permission: 'delete_posts' },
        { role: 'admin', permission: 'add_posts' },
        { role: 'admin', permission: 'manage_permissions' },
        { role: 'admin', permission: 'create_permissions' },
        { role: 'admin', permission: 'assign_permissions' },
        { role: 'admin', permission: 'assign_permissions' },
        { role: 'editor', permission: 'add_posts' },
        { role: 'editor', permission: 'edit_posts' },
        { role: 'editor', permission: 'delete_posts' },
        { role: 'user', permission: 'add_comments' },
        { role: 'user', permission: 'reply_to_comments' },
        { role: 'user', permission: 'reply_to_replies' }
    ];

    rolePermissions.forEach(rolePerm => {
        db.get(`SELECT id FROM permissions WHERE name = ?`, [rolePerm.permission], (err, row) => {
            if (row) {
                db.run(`INSERT OR IGNORE INTO role_permissions (role, permission_id) VALUES (?, ?)`, [rolePerm.role, row.id]);
            }
        });
    });
});

class Permission {
    static getPermissionsLookup() {
        
        let query = 'SELECT * FROM permissions';
        const params = [];

       

        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    static getPermissions({ page = 1, limit = 5, sortField = 'id', sortOrder = 'ASC', filter = {} } = {}) {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM permissions WHERE 1=1';
        const params = [];

        if (filter.name) {
            query += ' AND name LIKE ?';
            params.push(`%${filter.name}%`);
        }

        query += ` ORDER BY ${sortField} ${sortOrder}`;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    static getPermissionsCount(filter = {}) {
        let query = 'SELECT COUNT(*) AS count FROM permissions WHERE 1=1';
        const params = [];

        if (filter.name) {
            query += ' AND name LIKE ?';
            params.push(`%${filter.name}%`);
        }

        return new Promise((resolve, reject) => {
            db.get(query, params, (err, row) => {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                resolve(row.count);
            });
        });
    }

    static getRoles() {
        return new Promise((resolve, reject) => {
            db.all('SELECT DISTINCT role FROM role_permissions', (err, rows) => {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                resolve(rows.map(row => row.role));
            });
        });
    }

    static createPermission(name) {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO permissions (name) VALUES (?)', [name], function (err) {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                resolve({ id: this.lastID, name });
            });
        });
    }

    static assignPermissionToRole(role, permissionName) {
        return new Promise((resolve, reject) => {
            db.get('SELECT id FROM permissions WHERE name = ?', [permissionName], (err, row) => {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                if (!row) {
                    return reject(new Error('Permission not found'));
                }
                db.run('INSERT OR IGNORE INTO role_permissions (role, permission_id) VALUES (?, ?)', [role, row.id], function (err) {
                    if (err) {
                        Permission.logError(err);
                        return reject(err);
                    }
                    resolve({ id: this.lastID, role, permission_id: row.id });
                });
            });
        });
    }

    static hasPermission(role, permissionName) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT p.name FROM permissions p
                 JOIN role_permissions rp ON p.id = rp.permission_id
                 WHERE rp.role = ? AND p.name = ?`,
                [role, permissionName],
                (err, row) => {
                    if (err) {
                        Permission.logError(err);
                        return reject(err);
                    }
                    resolve(!!row);
                }
            );
        });
    }

    static getRolePermissions({ page = 1, limit = 5, sortField = 'role', sortOrder = 'ASC', filter = {} } = {}) {
        const offset = (page - 1) * limit;
        let query = `SELECT rp.id, rp.role, p.name AS permission FROM role_permissions rp
                     JOIN permissions p ON rp.permission_id = p.id WHERE 1=1`;
        const params = [];

        if (filter.role) {
            query += ' AND rp.role LIKE ?';
            params.push(`%${filter.role}%`);
        }

        if (filter.permission) {
            query += ' AND p.name LIKE ?';
            params.push(`%${filter.permission}%`);
        }

        query += ` ORDER BY ${sortField} ${sortOrder}`;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    static getRolePermissionsCount(filter = {}) {
        let query = `SELECT COUNT(*) AS count FROM role_permissions rp
                     JOIN permissions p ON rp.permission_id = p.id WHERE 1=1`;
        const params = [];

        if (filter.role) {
            query += ' AND rp.role LIKE ?';
            params.push(`%${filter.role}%`);
        }

        if (filter.permission) {
            query += ' AND p.name LIKE ?';
            params.push(`%${filter.permission}%`);
        }

        return new Promise((resolve, reject) => {
            db.get(query, params, (err, row) => {
                if (err) {
                    Permission.logError(err);
                    return reject(err);
                }
                resolve(row.count);
            });
        });
    }

    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }
}

module.exports = Permission;
