const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: 'info', // Set the logging level (e.g., 'info', 'warn', 'error')
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add a timestamp to each log
        format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [
        new transports.Console(), // Log to the console
        new transports.File({ filename: 'app.log' }) // Log to a file named 'app.log'
    ]
});

module.exports = logger;