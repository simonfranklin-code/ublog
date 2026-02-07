const sqlite3 = require('sqlite3').verbose();
const deepseek_chat_db = new sqlite3.Database('./database/deepseek-chat.db');

deepseek_chat_db.serialize(() => {
    deepseek_chat_db.run(`
        -- Table to store chat messages
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
          content TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    deepseek_chat_db.run(`
        --Add table to store named chat saves
        CREATE TABLE IF NOT EXISTS chat_saves(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        });
    `);

});

module.exports = deepseek_chat_db;