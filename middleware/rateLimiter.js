//const { io } = require('../app'); // ?? Adjust path as needed
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
let io = null;

function initRateLimiter(socketInstance) {
    io = socketInstance;
}
function logRateLimit(req, reason = 'Rate limit exceeded') {
    const logLine = `[${new Date().toISOString()}] IP: ${req.ip}, UserID: ${req.user?.id}, Path: ${req.originalUrl}, Reason: ${reason}\n`;
    const logPath = path.join(__dirname, '../logs/rate-limit.log');
    fs.appendFile(logPath, logLine, () => { });
    if (io) {
        io.to('admin').emit('admin-alert', {
            type: 'rate-limit',
            userId: req.user?.id,
            ip: req.ip,
            url: req.originalUrl,
            time: new Date().toISOString()
        });
    }
}

const clearChatLimiter = rateLimit({
    windowMs: 60000,
    max: 3,
    handler: (req, res) => {
        logRateLimit(req, 'Too many clearChatHistory attempts');
        res.status(429).json({ error: 'Too many attempts. Please wait and try again.' });
    }
});

module.exports = { clearChatLimiter, initRateLimiter };

