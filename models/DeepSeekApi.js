const db = require('./db');
const deepseek_chat_db = require('./deepseek-chat');
const fs = require('fs');
const { OpenAI } = require('openai');
const validator = require('validator');
const deepseekApiKey = 'sk-8b52f88bd2714004ad9b3706e157f4f3';
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: deepseekApiKey
});

class DeepSeekApi {

    static async createCompletion(message, session_id, user_id) {
        const systemPrompt = `
            The user will provide some exam text. Please parse the "question" and "answer" and output them in JSON format. The answer should be in Html.

            EXAMPLE INPUT: 
            Which is the highest mountain in the world? Mount Everest.

            EXAMPLE JSON OUTPUT:
            {
                "question": "Which is the highest mountain in the world?",
                "answer": "Mount Everest"
            }
            `;

        try {
            // Store user message
            await deepseek_chat_db.run(
                'INSERT INTO messages (session_id, user_id, role, content, data) VALUES (?, ?, ?, ?, ?)',
                [session_id, user_id, 'user', message, JSON.stringify(message)]
            );

            // Fetch full chat history for the session
            const history = await this.getDeepseekChatHistory(session_id);
            // Start with system prompt
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                { role: 'user', content: message } // latest message
            ];

            const response = await openai.chat.completions.create({
                model: "deepseek-chat",
                messages,
                response_format: { type: 'json_object' },
                temperature: 0
            });

            const content = response.choices?.[0]?.message?.content;

            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (parseError) {
                console.error('Failed to parse response:', response);
                DeepSeekApi.logError(response);
                throw new Error('Failed to parse AI response');

            }
            // Store assistant message
            await deepseek_chat_db.run(
                'INSERT INTO messages (session_id, user_id, role, content, data) VALUES (?, ?, ?, ?, ?)',
                [session_id, user_id, 'assistant', parsed.answer, JSON.stringify(parsed)]
            );
            return parsed;

        } catch (error) {
            console.error('Error in createCompletion:', error);
            DeepSeekApi.logError(error);
            throw error;
        }
    }


    static getDeepseekChatHistory(session_id, user_id) {
        try {

            const query = `SELECT * FROM messages WHERE session_id = ? AND user_id = ? ORDER BY timestamp ASC`;
            return new Promise((resolve, reject) => {
                deepseek_chat_db.all(query, [session_id, user_id], (err, messages) => {
                    if (err) return reject(err);
                    resolve(messages);
                });
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
        }
    }



    static clearChatHistory(session_id, user_id) {
        try {
            return new Promise((resolve, reject) => {
                deepseek_chat_db.run('DELETE FROM messages WHERE session_id = ? AND user_id = ?', [session_id, user_id], function (err, result) {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        } catch (error) {
            console.error('Error clearing chat history:', error);
            DeepSeekApi.logError(error);
        }
    }

    static async saveChatHistoryByName(session_id, user_id, name) {
        try {
            if (!validator.isLength(name, { min: 1, max: 100 })) throw new Error('Invalid chat name length');
            if (!/^[\w\s-]+$/.test(name)) throw new Error('Chat name contains invalid characters');

            const query = `INSERT INTO chat_saves (session_id, user_id, name) VALUES (?, ?, ?)`;
            console.log('Executing SQL:', query, [session_id, user_id, name]);

            return new Promise((resolve, reject) => {
                deepseek_chat_db.run(query, [session_id, user_id, name], function (err) {
                    if (err) {
                        console.error('SQL Error:', err);
                        return reject(err);
                    }
                    resolve(this.lastID);
                });
            });
        } catch (e) {
            console.error('Validation/SQL Save Error:', e);
            throw e;
        }
    }


    static async listSavedChats(user_id) {
        const query = `SELECT * FROM chat_saves WHERE user_id = ? ORDER BY saved_at DESC`;
        console.log('Executing SQL:', query, [user_id]);

        return new Promise((resolve, reject) => {
            deepseek_chat_db.all(query, [user_id], (err, rows) => {
                if (err) {
                    console.error('SQL Error:', err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    static async deleteSavedChatByName(user_id, name) {
        const query = `DELETE FROM chat_saves WHERE user_id = ? AND name = ?`;
        console.log('Executing SQL:', query, [user_id, name]);

        return new Promise((resolve, reject) => {
            deepseek_chat_db.run(query, [user_id, name], function (err) {
                if (err) {
                    console.error('SQL Error:', err);
                    return reject(err);
                }
                resolve(this.changes);
            });
        });
    }

    static logError(err) {
        const errorMessage = `${new Date().toISOString()} - Error: ${err.message} Data:` + JSON.stringify(err);
        fs.appendFile('error.log', errorMessage, (fsErr) => {
            if (fsErr) {
                console.error('Failed to write to log file:', fsErr);
            }
        });
    }


}

module.exports = DeepSeekApi;