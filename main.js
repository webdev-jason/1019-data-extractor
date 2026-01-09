const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false 
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

ipcMain.handle('run-analysis', async (event, filePaths) => {
  return new Promise((resolve, reject) => {
    
    // --- PATH CONFIGURATION ---
    // We are now looking for 'calc.exe', not 'calc.py'
    let scriptPath = path.join(__dirname, 'calc.exe');
    
    // Fix path for production (unpacked folder)
    if (app.isPackaged) {
        scriptPath = scriptPath.replace('app.asar', 'app.asar.unpacked');
    }

    console.log("Looking for executable at:", scriptPath);
    // -------------------------------

    console.log("Running analysis on files:", filePaths);
    
    // SPAWN CHANGE: 
    // Instead of spawn('python', ['script.py', args]),
    // We run the exe directly: spawn('path/to/exe', [args])
    const childProcess = spawn(scriptPath, filePaths);

    let resultData = '';

    childProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      console.error(`Calc Error: ${data}`);
    });

    childProcess.on('close', (code) => {
      console.log(`Process exited with code ${code}`);
      if (code === 0) {
        try {
          const jsonResponse = JSON.parse(resultData);
          resolve(jsonResponse);
        } catch (e) {
          console.error("JSON Parse Error:", e, "Raw Data:", resultData);
          reject("Failed to parse response");
        }
      } else {
        reject(`Calculation process exited with code ${code}`);
      }
    });
  });
});