const db = require('../models/db');
const fs = require('fs');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS "BlogPostReviews" (
            "BlogPostReviewId" INTEGER NOT NULL,
            "BlogPostId" INTEGER NOT NULL,
            "Slug" TEXT NOT NULL,
            "Rating" INTEGER,
            "Author" TEXT NOT NULL,
            "ReviewText" TEXT,
            "ReviewDate" DATETIME DEFAULT CURRENT_TIMESTAMP,
            "AuthorEmailAddress" TEXT NOT NULL,
            "UserId" INTEGER NOT NULL,
            PRIMARY KEY("BlogPostReviewId" AUTOINCREMENT),
            FOREIGN KEY("UserId") REFERENCES "users"("id"),
            FOREIGN KEY("BlogPostId") REFERENCES "BlogPosts"("BlogPostId") ON DELETE CASCADE
        );
    `);
});

class Review {
    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message}\n`;
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }

    static addReview(review) {
        return new Promise(async (resolve, reject) => {
            
            const { Slug, Rating, Author, ReviewText, AuthorEmailAddress, UserId } = review;
            const BlogPostId = await Review.getBlogPostId(Slug);
            db.run(
                `INSERT INTO BlogPostReviews (BlogPostId, Slug, Rating, Author, ReviewText, AuthorEmailAddress, UserId)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [BlogPostId, Slug, Rating, Author, ReviewText, AuthorEmailAddress, UserId],
                function (err) {
                    if (err) {
                        Review.logError(err);
                        return reject(err);
                    }
                    resolve(this.lastID);  // Return the ID of the newly inserted review
                }
            );
        });
    }

    static getReviewsByPostId(BlogPostId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM BlogPostReviews WHERE BlogPostId = ?', [BlogPostId], (err, rows) => {
                if (err) {
                    Review.logError(err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    static getReviewsBySlug(slug) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM BlogPostReviews WHERE Slug LiKE ?', [slug], (err, rows) => {
                if (err) {
                    Review.logError(err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    static getBlogPostId(slug) {
        return new Promise((resolve, reject) => {
            db.get('SELECT BlogPostId FROM BlogPosts WHERE Slug LIKE ?', [slug], (err, blogPost) => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                resolve(blogPost ? blogPost.BlogPostId : null);
            });
        });
    }

    static updateReview(review) {
        return new Promise((resolve, reject) => {
            const { BlogPostReviewId, Rating, Author, ReviewText, AuthorEmailAddress } = review;
            db.run(
                `UPDATE BlogPostReviews SET Rating = ?, Author = ?, ReviewText = ?, AuthorEmailAddress = ?
                 WHERE BlogPostReviewId = ?`,
                [Rating, Author, ReviewText, AuthorEmailAddress, BlogPostReviewId],
                function (err) {
                    if (err) {
                        Review.logError(err);
                        return reject(err);
                    }
                    resolve(this.changes);  // Number of rows updated
                }
            );
        });
    }

    static deleteReview(BlogPostReviewId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM BlogPostReviews WHERE BlogPostReviewId = ?', [BlogPostReviewId], function (err) {
                if (err) {
                    Review.logError(err);
                    return reject(err);
                }
                resolve(this.changes);  // Number of rows deleted
            });
        });
    }
}

module.exports = Review;

