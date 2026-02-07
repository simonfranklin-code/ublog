const db = require('./db');

class BlogPostView {
    static getBlogPostIdBySlug(slug) {
        return new Promise((resolve, reject) => {
            db.get('SELECT BlogPostId FROM BlogPosts WHERE Slug = ?', [slug], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row ? row.BlogPostId : null);
            });
        });
    }

    static addView(view) {
        return new Promise((resolve, reject) => {
            const { BlogPostId, UserId } = view;
            db.run('INSERT INTO BlogPostViews (BlogPostId, UserId) VALUES (?, ?)', [BlogPostId, UserId], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });
    }
}

module.exports = BlogPostView;
