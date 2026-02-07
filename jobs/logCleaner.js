const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const LOG_PATH = path.join(__dirname, '../logs/rate-limit.log');
const MAX_AGE_DAYS = 30;

function removeOldLogEntries() {
    if (!fs.existsSync(LOG_PATH)) return;

    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const lines = fs.readFileSync(LOG_PATH, 'utf-8').split('\n');

    const filtered = lines.filter(line => {
        const match = line.match(/^\[(.*?)\]/);
        if (!match) return false;

        const timestamp = new Date(match[1]);
        return timestamp.getTime() > cutoff;
    });

    fs.writeFileSync(LOG_PATH, filtered.join('\n'), 'utf-8');
    console.log(`[LOG CLEANER] Cleaned log at ${new Date().toISOString()}`);
}

// Runs at 3:00 AM daily
cron.schedule('0 3 * * *', removeOldLogEntries);
