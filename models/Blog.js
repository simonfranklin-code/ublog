const db = require('../models/db');
db.serialize(() => {
    db.run(`

        CREATE TABLE IF NOT EXISTS "Blogs" (
	        "BlogId"	INTEGER NOT NULL,
	        "Title"	TEXT NOT NULL,
	        "Description"	TEXT,
	        "BaseDirectory"	TEXT,
	        "MetaKeywords"	TEXT,
	        "MetaDescription"	TEXT,
	        "HeadStylesBlock"	TEXT,
	        "HeadScriptsBlock"	TEXT,
	        "DateCreated"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	        "Owner"	TEXT,
	        "UserId"	INTEGER,
	        "Slug"	TEXT,
	        "BlogHeader"	TEXT,
	        "BlogFooter"	TEXT,
	        CONSTRAINT "PK_Blogs" PRIMARY KEY("BlogId" AUTOINCREMENT),
	        FOREIGN KEY("UserId") REFERENCES "users"("id") ON UPDATE CASCADE
        );
    `);
});

class Blog {
    static add(title, description, owner, userId, baseDirectory, metaKeywords, metaDescription, headStylesBlock, headScriptsBlock, slug) {
        const dateCreated = new Date().toISOString();
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO Blogs (Title, Description, Owner, UserId, BaseDirectory, MetaKeywords, MetaDescription, HeadStylesBlock, HeadScriptsBlock, Slug ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, description, owner, userId, baseDirectory, metaKeywords, metaDescription, headStylesBlock, headScriptsBlock, slug], function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
        });
    }

    static edit(blogId, title, description, owner, userId, baseDirectory, metaKeywords, metaDescription, headStylesBlock, headScriptsBlock, slug, blogHeader, blogFooter) {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE Blogs SET Title = ?, Description = ?, Owner = ?, UserId = ?, BaseDirectory = ?, MetaKeywords = ?, MetaDescription = ?, HeadStylesBlock = ?, HeadScriptsBlock = ?, Slug = ?, BlogHeader = ?, BlogFooter = ? WHERE BlogId = ?`,
                [title, description, owner, userId, baseDirectory, metaKeywords, metaDescription, headStylesBlock, headScriptsBlock, slug, blogHeader, blogFooter, blogId], function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                });
        });
    }

    static delete(blogId) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM Blogs WHERE BlogId = ?`, [blogId], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }

    static get(blogId) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM Blogs WHERE BlogId = ?`, [blogId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    static getBlogBySlug(slug) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM Blogs WHERE Slug = ?`, [slug], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    static getBlogSlugByBlogId(id) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT Slug FROM Blogs WHERE BlogId = ?`, [id], (err, slug) => {
                if (err) return reject(err);
                resolve(slug);
            });
        });
    }

    static getAllBlogsLookup() {
        const query = `SELECT BlogId, Title FROM Blogs WHERE 1=1 ORDER BY Title ASC`;
        return new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static getAll(page = 1, limit = 5, sortField = 'DateCreated', sortOrder = 'DESC', filters = {}) {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [];
        if (filters.title) {
            whereClause += ' AND Title LIKE ?';
            params.push(`%${filters.title}%`);
        }
        if (filters.author) {
            whereClause += ' AND Author LIKE ?';
            params.push(`%${filters.author}%`);
        }
        const query = `SELECT * FROM Blogs WHERE 1=1${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
        return new Promise((resolve, reject) => {
            db.all(query, [...params, limit, offset], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static getBlogsCount(filter = {}) {
        let query = 'SELECT COUNT(*) AS count FROM Blogs WHERE 1=1';
        const params = [];

        if (filter.name) {
            query += ' AND name LIKE ?';
            params.push(`%${filter.name}%`);
        }

        return new Promise((resolve, reject) => {
            db.get(query, params, (err, row) => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(row.count);
            });
        });
    }
}

module.exports = Blog;
