const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Preload script is the security guard. It controls what the website can access.
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
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
// These are the "events" we listen for from the frontend (the web page)

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
    // 'python' is the command, ['calc.py', ...filePaths] are the arguments
    const pythonProcess = spawn('python', ['calc.py', ...filePaths]);

    let resultData = '';

    // Collect data printed by Python
    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON string received from Python back into a JavaScript Object
          const jsonResponse = JSON.parse(resultData);
          resolve(jsonResponse);
        } catch (e) {
          reject("Failed to parse Python response");
        }
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
});