// controllers/messageController.js
const Message = require('../models/Message');

exports.getHistory = async (req, res) => {
    const { receiverId } = req.query;
    const senderId = req.user.id;

    try {
        const history = await Message.getConversation(senderId, receiverId);
        res.json({ success: true, history });
    } catch (err) {
        Message.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    try {
        const messageId = await Message.createMessage(senderId, receiverId, content);
        res.json({ success: true, message: 'Message sent', messageId });
    } catch (err) {
        Message.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};