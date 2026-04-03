const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// NEW: Handle creating/removing shortcuts on Windows when installing/uninstalling.
// This prevents the app from launching multiple times or "flashing" during first run.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 750, 
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
    const fileDetails = [];

    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      let dateVal = "Unknown";
      let timeVal = "";

      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);
        
        for (const line of lines) {
          if (line.startsWith('Date;')) {
            const rawData = line.replace('Date;', '');
            const parts = rawData.split(',');
            
            if (parts.length >= 2) {
                dateVal = parts[0];
                timeVal = parts[1];
            } else {
                dateVal = rawData; 
            }
            break;
          }
        }
      } catch (err) {
        console.error(`Failed to read header for ${fileName}`, err);
      }

      fileDetails.push({
        path: filePath,
        name: fileName,
        date: dateVal,
        time: timeVal
      });
    }

    return fileDetails;
  }
});

ipcMain.handle('run-analysis', async (event, filePaths) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Starting native Node.js analysis on:", filePaths);

      let totals = { Ra: 0, Rz: 0, Rmr: 0 };
      let counts = { Ra: 0, Rz: 0, Rmr: 0 };

      for (const filePath of filePaths) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);

        for (const line of lines) {
          if (line.startsWith('Ra;')) {
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

      const averages = {};
      for (const key of ['Ra', 'Rz', 'Rmr']) {
        if (counts[key] > 0) {
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