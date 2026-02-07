const db = require('../models/db');

db.serialize(() => {
    db.run(`
			CREATE TABLE IF NOT EXISTS "BlogPosts" (
				"BlogPostId"	INTEGER NOT NULL,
				"Title"	TEXT NOT NULL,
				"Content"	TEXT NOT NULL,
				"CreatedAt"	DATETIME DEFAULT CURRENT_TIMESTAMP,
				"UpdatedAt"	DATETIME,
				"BlogId"	INTEGER NOT NULL,
				"Slug"	TEXT,
				"UserId"	TEXT,
				"Author"	TEXT,
				"MetaKeywords"	TEXT,
				"MetaDescription"	TEXT,
				"Footer"	TEXT,
				"BeforeEndOfBodyScript"	TEXT,
				"Publisher"	TEXT,
				"DraftPageName"	TEXT,
				PRIMARY KEY("BlogPostId" AUTOINCREMENT),
				FOREIGN KEY("BlogId") REFERENCES "Blogs"("BlogId") ON DELETE CASCADE,
				FOREIGN KEY("UserId") REFERENCES "users"("id") ON UPDATE CASCADE
			);
    `);
});

class BlogPost {
	static add(title, slug, blogId, author, userId, content, draftPageName) {
        
        return new Promise((resolve, reject) => {
			db.run(`INSERT INTO BlogPosts (Title, Content, BlogId, Author, UserId, Slug, DraftPageName) VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[title, content, blogId, author, userId, slug, draftPageName], function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
        });
    }

	static edit(blogPostId, title, slug, blogId, author, userId, content, metaDescription, metaKeywords, footer, publisher, draftPageName) {
        const updatedAt = new Date().toISOString();
        return new Promise((resolve, reject) => {
			db.run(`UPDATE BlogPosts SET Title = ?, Slug = ?, UpdatedAt = ?, BlogId = ?, Author = ?, UserId = ?, Content = ?, MetaDescription = ?, MetaKeywords = ?, Footer = ?, Publisher = ?, DraftPageName = ? WHERE BlogPostId = ?`,
				[title, slug, updatedAt, blogId, author, userId, content, metaDescription, metaKeywords, footer, publisher, draftPageName, blogPostId], function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                });
        });
    }

    static delete(blogPostId) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM BlogPosts WHERE BlogPostId = ?`, [blogPostId], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }

    static get(blogPostId) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM BlogPosts WHERE BlogPostId = ?`, [blogPostId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    static getBlogPostBySlug(slug) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM BlogPosts WHERE Slug = ?`, [slug.toLowerCase()], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    static getAll(page = 1, limit = 10, sortField = 'CreatedAt', sortOrder = 'DESC', filters = {}) {
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
        if (filters.blogId) {
            whereClause += ' AND BlogId = ?';
            params.push(filters.blogId);
        }
        const query = `SELECT * FROM BlogPosts WHERE 1=1${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
        return new Promise((resolve, reject) => {
            db.all(query, [...params, limit, offset], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

	static getAllBlogPostsByBlogIdLookup(blogId) {
		const query = `SELECT BlogPostId, Title FROM BlogPosts WHERE BlogId = ? ORDER BY Title ASC`;
		return new Promise((resolve, reject) => {
			db.all(query, [blogId], (err, rows) => {
				if (err) return reject(err);
				resolve(rows);
			});		
		});
	}	
    static getBlogPostsCount(filter = {}) {
        let query = 'SELECT COUNT(*) AS count FROM BlogPosts WHERE 1=1';
        const params = [];

        if (filter.title) {
            query += ' AND Title LIKE ?';
            params.push(`%${filter.title}%`);
        }

        return new Promise((resolve, reject) => {
            db.get(query, params, (err, row) => {
                if (err) return reject(err);
                resolve(row.count);
            });
        });
    }

    static getBlogPostsStats(blogPostId) {
        let query = `
			WITH RecentCounts AS (
				SELECT
					bp.BlogPostId,
					COUNT(DISTINCT bv.BlogPostViewId) AS RecentBlogPostViewCount,
					COUNT(DISTINCT c.CommentId) AS RecentCommentCount,
					COUNT(DISTINCT br.BlogPostReviewId) AS RecentBlogPostReviewCount,
					COUNT(DISTINCT pl.id) AS RecentPostLikeCount,
					COUNT(DISTINCT rl.ReviewLikeId) AS RecentReviewLikeCount,
					COUNT(DISTINCT cl.id) AS RecentCommentLikeCount -- Added Comment Likes
				FROM
					BlogPosts bp
				LEFT JOIN BlogPostViews bv ON bp.BlogPostId = bv.BlogPostId AND bv.ViewDate >= DATE('now', '-30 days')
				LEFT JOIN Comments c ON bp.BlogPostId = c.BlogPostId AND c.DateCreated >= DATE('now', '-30 days')
				LEFT JOIN BlogPostReviews br ON bp.BlogPostId = br.BlogPostId AND br.ReviewDate >= DATE('now', '-30 days')
				LEFT JOIN post_likes pl ON bp.BlogPostId = pl.post_id AND pl.id IN (
					SELECT id FROM post_likes WHERE id >= DATE('now', '-30 days')
				)
				LEFT JOIN ReviewLikes rl ON br.BlogPostReviewId = rl.BlogPostReviewId AND rl.ReviewLikeId >= DATE('now', '-30 days')
				LEFT JOIN comment_likes cl ON c.CommentId = cl.comment_id AND cl.id >= DATE('now', '-30 days') -- Filter Comment Likes
				GROUP BY bp.BlogPostId
			),
			PreviousCounts AS (
				SELECT
					bp.BlogPostId,
					COUNT(DISTINCT bv.BlogPostViewId) AS PreviousBlogPostViewCount,
					COUNT(DISTINCT c.CommentId) AS PreviousCommentCount,
					COUNT(DISTINCT br.BlogPostReviewId) AS PreviousBlogPostReviewCount,
					COUNT(DISTINCT pl.id) AS PreviousPostLikeCount,
					COUNT(DISTINCT rl.ReviewLikeId) AS PreviousReviewLikeCount,
					COUNT(DISTINCT cl.id) AS PreviousCommentLikeCount -- Added Comment Likes
				FROM
					BlogPosts bp
				LEFT JOIN BlogPostViews bv ON bp.BlogPostId = bv.BlogPostId AND bv.ViewDate BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days')
				LEFT JOIN Comments c ON bp.BlogPostId = c.BlogPostId AND c.DateCreated BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days')
				LEFT JOIN BlogPostReviews br ON bp.BlogPostId = br.BlogPostId AND br.ReviewDate BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days')
				LEFT JOIN post_likes pl ON bp.BlogPostId = pl.post_id AND pl.id IN (
					SELECT id FROM post_likes WHERE id BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days')
				)
				LEFT JOIN ReviewLikes rl ON br.BlogPostReviewId = rl.BlogPostReviewId AND rl.ReviewLikeId BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days')
				LEFT JOIN comment_likes cl ON c.CommentId = cl.comment_id AND cl.id BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days') -- Filter Comment Likes
				GROUP BY bp.BlogPostId
			)
			SELECT
				bp.BlogPostId,
				bp.Title,
				COUNT(DISTINCT bv.BlogPostViewId) AS BlogPostViewCount,
				COUNT(DISTINCT bv.UserId) AS UniqueViewCount,
				COUNT(DISTINCT c.CommentId) AS CommentCount,
				COUNT(DISTINCT br.BlogPostReviewId) AS BlogPostReviewCount,
				COUNT(DISTINCT pl.id) AS PostLikeCount,
				COUNT(DISTINCT rl.ReviewLikeId) AS ReviewLikeCount,
				COUNT(DISTINCT cl.id) AS CommentLikeCount,
				AVG(br.Rating) AS AverageRating,
				COUNT(DISTINCT pl.id) + COUNT(DISTINCT rl.ReviewLikeId) + COUNT(DISTINCT cl.id) AS TotalLikes,
				rc.RecentBlogPostViewCount,
				pc.PreviousBlogPostViewCount,
				CASE
					WHEN pc.PreviousBlogPostViewCount = 0 THEN 'N/A'
					ELSE ROUND(((rc.RecentBlogPostViewCount - pc.PreviousBlogPostViewCount) * 1.0 / pc.PreviousBlogPostViewCount) * 100, 2)
				END AS BlogPostViewCountIncreasePercent,
				rc.RecentCommentCount,
				pc.PreviousCommentCount,
				CASE
					WHEN pc.PreviousCommentCount = 0 THEN 'N/A'
					ELSE ROUND(((rc.RecentCommentCount - pc.PreviousCommentCount) * 1.0 / pc.PreviousCommentCount) * 100, 2)
				END AS CommentCountIncreasePercent,
				rc.RecentPostLikeCount,
				pc.PreviousPostLikeCount,
				CASE
					WHEN pc.PreviousPostLikeCount = 0 THEN 'N/A'
					ELSE ROUND(((rc.RecentPostLikeCount - pc.PreviousPostLikeCount) * 1.0 / pc.PreviousPostLikeCount) * 100, 2)
				END AS PostLikeCountIncreasePercent,
				rc.RecentReviewLikeCount,
				pc.PreviousReviewLikeCount,
				CASE
					WHEN pc.PreviousReviewLikeCount = 0 THEN 'N/A'
					ELSE ROUND(((rc.RecentReviewLikeCount - pc.PreviousReviewLikeCount) * 1.0 / pc.PreviousReviewLikeCount) * 100, 2)
				END AS ReviewLikeCountIncreasePercent,
				rc.RecentCommentLikeCount,
				pc.PreviousCommentLikeCount,
				CASE
					WHEN pc.PreviousCommentLikeCount = 0 THEN 'N/A'
					ELSE ROUND(((rc.RecentCommentLikeCount - pc.PreviousCommentLikeCount) * 1.0 / pc.PreviousCommentLikeCount) * 100, 2)
				END AS CommentLikeCountIncreasePercent -- Added Percent Increase for Comment Likes
			FROM
				BlogPosts bp
			LEFT JOIN BlogPostViews bv ON bp.BlogPostId = bv.BlogPostId
			LEFT JOIN Comments c ON bp.BlogPostId = c.BlogPostId
			LEFT JOIN BlogPostReviews br ON bp.BlogPostId = br.BlogPostId
			LEFT JOIN post_likes pl ON bp.BlogPostId = pl.post_id
			LEFT JOIN ReviewLikes rl ON br.BlogPostReviewId = rl.BlogPostReviewId
			LEFT JOIN comment_likes cl ON c.CommentId = cl.comment_id
			LEFT JOIN RecentCounts rc ON bp.BlogPostId = rc.BlogPostId
			LEFT JOIN PreviousCounts pc ON bp.BlogPostId = pc.BlogPostId
			WHERE bp.BlogPostId = ?
			GROUP BY
				bp.BlogPostId, bp.Title, rc.RecentBlogPostViewCount, pc.PreviousBlogPostViewCount,
				rc.RecentCommentCount, pc.PreviousCommentCount,
				rc.RecentPostLikeCount, pc.PreviousPostLikeCount,
				rc.RecentReviewLikeCount, pc.PreviousReviewLikeCount,
				rc.RecentCommentLikeCount, pc.PreviousCommentLikeCount
			ORDER BY
				bp.BlogPostId;




        `;


        return new Promise((resolve, reject) => {
            db.get(query, [blogPostId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

}

module.exports = BlogPost;
