const DeepSeekApi = require('../models/DeepSeekApi');

exports.deepseekDashboard = async (req, res) => {
    res.render('user/deepseekDashboard', { user: req.user });
}

exports.createCompletion = async (req, res) => {
    const { message, session_id } = req.body;
    const result = await DeepSeekApi.createCompletion(message, session_id, req.user.id );
    res.json({ data: result })
}

exports.getDeepseekChatHistory = async (req, res) => {
    try {
        const { session_id } = req.body;
        const messages = await DeepSeekApi.getDeepseekChatHistory(session_id, req.user.id);
        res.json(messages);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error retrieving history' });
    }
}

exports.clearDeepseekChatHistory = async (req, res) => {
    const { session_id } = req.body;
    try {
        await DeepSeekApi.clearChatHistory(session_id, req.user.id);
        res.json({ success: true, message: 'Chat history cleared.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Failed to clear chat history' });
    }
};


exports.saveChat = async (req, res) => {
    const { session_id, name } = req.body;
    try {
        const result = await DeepSeekApi.saveChatHistoryByName(session_id, req.user.id, name);
        res.json({ success: true, id: result });
    } catch (err) {
        console.error('Save chat failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.listSavedChats = async (req, res) => {
    try {
        const chats = await DeepSeekApi.listSavedChats(req.user.id);
        res.json({ success: true, data: chats });
    } catch (err) {
        console.error('List chats failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteSavedChat = async (req, res) => {
    const { name } = req.body;
    try {
        await DeepSeekApi.deleteSavedChatByName(req.user.id, name);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete chat failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};



