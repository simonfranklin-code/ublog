const db = require('../models/db');
const fs = require('fs');
const hljs = require('highlight.js');
const { v4: uuidv4 } = require('uuid');
const sanitizeHtml = require('sanitize-html');

db.serialize(() => { 
    db.run(`
        CREATE TABLE IF NOT EXISTS "Comments" (
	        "CommentId"	INTEGER NOT NULL,
	        "Text"	TEXT NOT NULL,
	        "DateCreated"	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	        "DateModified"	DATETIME NOT NULL,
	        "BlogPostId"	INTEGER NOT NULL,
	        "BlogPostSlug"	TEXT,
	        "ParentCommentId"	INTEGER,
	        "Author"	TEXT,
	        "Url"	TEXT,
	        "Email"	TEXT,
	        "DisplayName"	TEXT,
	        "IsOpen"	INTEGER,
	        "UserId"	INTEGER,
	        "Title"	TEXT,
	        "CodeDescription"	TEXT,
	        CONSTRAINT "PK_Comments" PRIMARY KEY("CommentId" AUTOINCREMENT),
	        CONSTRAINT "FK_Comments_BlogPosts_BlogPostId" FOREIGN KEY("BlogPostId") REFERENCES "BlogPosts"("BlogPostId") ON DELETE CASCADE,
	        CONSTRAINT "FK_Comments_users_id" FOREIGN KEY("UserId") REFERENCES "users"("id") ON DELETE CASCADE
        );
    `);
});



class Comment {
    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

    static getBlogPostId(slug) {
        return new Promise((resolve, reject) => {
            db.get('SELECT BlogPostId FROM BlogPosts WHERE Slug = ?', [slug], (err, blogPost) => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(blogPost ? blogPost.BlogPostId : null);
            });
        });
    }

    static deleteComment(commentId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM Comments WHERE CommentId = ?', [commentId], function (err) {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(this.changes);  // Return the number of rows deleted
            });
        });
    }

    static getComments(slug) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM Comments WHERE BlogPostSlug = ? AND ParentCommentId = 0', [slug], (err, comments) => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(comments);
            });
        });
    }

    static getReplies(slug, commentId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM Comments WHERE BlogPostSlug = ? AND ParentCommentId = ?', [slug, commentId], (err, replies) => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(replies);
            });
        });
    }

    static addCommentReply(commentData) {
        return new Promise((resolve, reject) => {
            let highlightedCode = '';
            let selectedCode = '';
            let textFieldValue = '';
            const guid = uuidv4();
            const { Title, CodeDescription, Email, Author, DisplayName, Url, Text, DateModified, BlogPostSlug, ParentCommentId, IsOpen, BlogPostId, CodeLanguage, UserId } = commentData;
            if (CodeLanguage !== 'undefined') {
                if (CodeLanguage === "javascript") {
                    selectedCode = 'JavaScript code:';
                    highlightedCode = hljs.highlight(Text, { language: 'javascript' }).value;
                } else if (CodeLanguage === "html") {
                    selectedCode = 'HTML code:';
                    highlightedCode = hljs.highlight(Text, { language: 'xml' }).value;
                } else if (CodeLanguage === "css") {
                    selectedCode = 'CSS Code:';
                    highlightedCode = hljs.highlight(Text, { language: 'css' }).value;
                } else if (CodeLanguage === "text") {
                    selectedCode = 'Text:';
                    highlightedCode = Text;
                }
                if (CodeLanguage === "text") {
                    highlightedCode = sanitizeHtml(highlightedCode, {
                        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'p', 'strong', 'br', 'span']),
                        allowedAttributes: {
                            'a': ['href', 'class', 'name', 'target', 'id'],
                            'img': ['src'],
                            'p': ['class'],
                            'section': ['data-bs-version', 'class', 'style', 'id'],
                            'div': ['class', 'id', 'style'],
                            'span': ['class', 'style', 'id'],
                            'h1': ['class', 'id'],
                            'h2': ['class', 'id'],
                            'h3': ['class', 'id'],
                            'h4': ['class', 'id'],
                            'h5': ['class', 'id'],
                            'h6': ['class', 'id'],

                        },
                        // Customize your allowed tags and attributes here
                    });
                    textFieldValue = highlightedCode;
                } else {
                    textFieldValue = `
                    <div class="card">
                        <div class="card-header">
                            <span style="float: left; margin:0 !important;">${selectedCode}</span> <span onclick='copyCode("${guid}")' style="float: right; margin:0 !important; "><i class="fas fa-copy"></i>&nbsp;Copy:</span>
                        </div>
                        <div class="card-body">
                            <pre>
                                <code class="hljs" id="${guid}">${highlightedCode}</code>
                            </pre>
                        </div>
                    </div>`;
                }


            }
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                db.run("INSERT INTO Comments (Email, Author, DisplayName, Url, Text, DateModified, BlogPostSlug, ParentCommentId, IsOpen, BlogPostId, UserId, Title, CodeDescription) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [Email, Author, DisplayName, Url, textFieldValue, DateModified, BlogPostSlug, ParentCommentId, IsOpen, BlogPostId, UserId, Title, CodeDescription], function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            this.logError(err);
                            return reject(err);
                        }
                        db.get('SELECT last_insert_rowid() as id', (err, insertedRow) => {
                            if (err) {
                                db.run('ROLLBACK');
                                this.logError(err);
                                return reject(err);
                            }
                            db.run('COMMIT');
                            resolve(insertedRow.id);
                        });
                    });
            });
        });
    }

    static getCommentById(commentId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM Comments WHERE CommentId = ?', [commentId], (err, row) => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    static async updateComment({ title, codeDescription, email, author, displayName, url, text, blogPostId, userId, commentId }) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE Comments 
                SET Title = ?, CodeDescription = ?, Email = ?, Author = ?, DisplayName = ?, Url = ?, Text = ?, BlogPostId = ?, UserId = ?
                WHERE CommentId = ?
            `;
            db.run(sql, [title, codeDescription, email, author, displayName, url, text, blogPostId, userId, commentId], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }


}

module.exports = Comment;