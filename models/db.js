const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/You-Blog.db');

db.serialize(() => {
    db.run(`
        -- Table to store blog post views
        CREATE TABLE IF NOT EXISTS BlogPostViews (
            BlogPostViewId INTEGER PRIMARY KEY AUTOINCREMENT,
            BlogPostId INTEGER NOT NULL,
            UserId INTEGER NOT NULL,
            ViewDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (BlogPostId) REFERENCES BlogPosts(BlogPostId),
            FOREIGN KEY (UserId) REFERENCES users(id)
        );
    `);
});

db.serialize(() => {
    db.run(`
-- Table to store notification statistics
        CREATE TABLE IF NOT EXISTS NotificationStats (
            NotificationStatId INTEGER PRIMARY KEY AUTOINCREMENT,
            UserId INTEGER NOT NULL,
            Comments INTEGER DEFAULT 0,
            Reviews INTEGER DEFAULT 0,
            BlogPostViews INTEGER DEFAULT 0,
            Likes INTEGER DEFAULT 0,
            FOREIGN KEY (UserId) REFERENCES users(id)
        );
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(friend_id) REFERENCES users(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
      FOREIGN KEY(requester_id) REFERENCES users(id),
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS Modals (
	    "ModalId"	INTEGER NOT NULL,
	    "ModalName"	TEXT NOT NULL,
	    "ModalTitle"	TEXT NOT NULL,
	    "ModalHeader"	TEXT,
	    "ModalBody"	TEXT,
	    "ModalFooter"	TEXT,
	    "DateCreated"	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	    "DateUpdated"	DATETIME,
	    "BlogpostId"	INTEGER NOT NULL,
	    "Anchor"	TEXT NOT NULL,
	    "Slug"	TEXT NOT NULL,
	    PRIMARY KEY("ModalId" AUTOINCREMENT)
        )
    `)

});
module.exports = db;