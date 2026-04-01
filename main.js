const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs'); // Core Concept: Node's native File System module

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.ico'), 
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

// NATIVE JAVASCRIPT PARSER
ipcMain.handle('run-analysis', async (event, filePaths) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Starting native Node.js analysis on:", filePaths);

      let totals = { Ra: 0, Rz: 0, Rmr: 0 };
      let counts = { Ra: 0, Rz: 0, Rmr: 0 };

      // Loop through each selected file
      for (const filePath of filePaths) {
        // Read the entire text file synchronously
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Split the text into an array of individual lines
        const lines = fileContent.split(/\r?\n/);

        // Check each line for our target data
        for (const line of lines) {
          if (line.startsWith('Ra;')) {
            // Split "Ra;0.162;um;;OK" by ";" and take the second item (index 1)
            const val = parseFloat(line.split(';')[1]);
            if (!isNaN(val)) { totals.Ra += val; counts.Ra++; }
          } 
          else if (line.startsWith('Rz;')) {
            const val = parseFloat(line.split(';')[1]);
            if (!isNaN(val)) { totals.Rz += val; counts.Rz++; }
          } 
          else if (line.startsWith('Rmr;')) {
            const val = parseFloat(line.split(';')[1]);
            if (!isNaN(val)) { totals.Rmr += val; counts.Rmr++; }
          }
        }
      }

      // Calculate Averages
      const averages = {};
      for (const key of ['Ra', 'Rz', 'Rmr']) {
        if (counts[key] > 0) {
          // Calculate, round to 3 decimal places, and ensure it remains a Number type
          averages[key] = Number((totals[key] / counts[key]).toFixed(3));
        } else {
          averages[key] = "N/A";
        }
      }

      console.log("Analysis Complete:", averages);
      resolve(averages);

    } catch (error) {
      console.error("Native Analysis Error:", error);
      reject("Failed to read or parse files natively.");
    }
  });
});