const { contextBridge, ipcRenderer } = require('electron');

console.log("✅ Preload script loaded successfully!");

contextBridge.exposeInMainWorld('api', {
    selectFiles: () => ipcRenderer.invoke('dialog:openFile'),
    analyzeData: (filePaths) => ipcRenderer.invoke('run-analysis', filePaths)
});