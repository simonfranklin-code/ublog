const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let serverProcess;
let mainWindow;

function startServer() {
    const serverFile = path.join(__dirname, 'server.js'); // <-- CHANGE THIS
    serverProcess = spawn('node', [serverFile], {
        stdio: 'inherit'
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadURL("http://localhost:10000");
}

app.whenReady().then(() => {
    startServer();

    // Wait longer because your app is heavy
    setTimeout(() => {
        createWindow();
    }, 5000);
});

app.on("quit", () => {
    if (serverProcess) serverProcess.kill();
});



