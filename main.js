const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  // Debug: Print where Electron is looking for the preload file
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log("Loading preload script from:", preloadPath);

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false  // <--- THIS IS THE KEY FIX
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open the DevTools automatically so we can see if it works
  // mainWindow.webContents.openDevTools(); 
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS ---

// 1. Listen for "open-file-dialog"
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (canceled) {
    return [];
  } else {
    return filePaths;
  }
});

// 2. Listen for "run-analysis"
ipcMain.handle('run-analysis', async (event, filePaths) => {
  return new Promise((resolve, reject) => {
    // This spawns a new Python process
    console.log("Running Python on files:", filePaths);
    const pythonProcess = spawn('python', ['calc.py', ...filePaths]);

    let resultData = '';

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python exited with code ${code}`);
      if (code === 0) {
        try {
          const jsonResponse = JSON.parse(resultData);
          resolve(jsonResponse);
        } catch (e) {
          console.error("JSON Parse Error:", e, "Raw Data:", resultData);
          reject("Failed to parse Python response");
        }
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
});