// nw-start.js
const app = require('./app');

const PORT = 3000;

const server = app.listen(PORT, () => {
    console.log(`Express running on http://localhost:${PORT}`);
});

nw.Window.open(`http://localhost:${PORT}`, {
    width: 1024,
    height: 768
});

nw.App.on('close', () => {
    server.close(() => process.exit(0));
});
