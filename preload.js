// File: preload.js
/**
 * Preload script: expose safe, minimal API to renderer (contextBridge).
 * Keep things small to maintain security.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAppInfo: async () => {
        return ipcRenderer.invoke('app/get-version');
    },
    // Expose a safe fetch wrapper if you want to talk to local Express API without CORS issues.
    fetchJSON: async (path) => {
        const res = await fetch(path);
        return res.json();
    }
});