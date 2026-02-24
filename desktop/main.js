// Electron and core imports FIRST
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');

// -------------------------------------------------------------------------
// CRITICAL: INITIALIZATION ORDER
// -------------------------------------------------------------------------
// On Windows, we MUST set the app name and ID BEFORE resolving any paths (like 'userData')
// to ensure we look in the correct AppData folder.
app.setName('Bachat Bazaar');
app.setAppUserModelId('com.bachatbazaar.pos');

// Check if running in development mode
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;
const SERVER_PORT = 5001;

// -------------------------------------------------------------------------
// APP PATHS & DIRECTORIES
// -------------------------------------------------------------------------
// Using standard Electron userData path for platform consistency
const appDataPath = app.getPath('userData');
const logFile = path.join(appDataPath, 'app.log');

// Persistent logging to file
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  const msg = `[${new Date().toISOString()}] [LOG] ` + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') + '\n';
  logStream.write(msg);
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  const msg = `[${new Date().toISOString()}] [ERROR] ` + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') + '\n';
  logStream.write(msg);
  originalConsoleError.apply(console, args);
};

console.log('App initialization started');
console.log('Log file:', logFile);

// --- IPC handlers: MUST be after appDataPath is defined ---
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => appDataPath);
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});
ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
});

// Auto-update setup
app.on('ready', async () => {
  try {
    // Auto-update check
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', () => {
      if (mainWindow) {
        mainWindow.webContents.send('update-available');
      }
    });
    autoUpdater.on('update-downloaded', () => {
      if (mainWindow) {
        mainWindow.webContents.send('update-downloaded');
      }
    });
    autoUpdater.on('error', (err) => {
      if (mainWindow) {
        mainWindow.webContents.send('update-error', err.message);
      }
    });
  } catch (error) {
    console.error('Failed to start auto-update setup:', error);
  }
});

// -------------------------------------------------------------------------
// DATABASE BOOTSTRAPPING
// -------------------------------------------------------------------------
const dbFile = path.join(appDataPath, 'pos.db');

if (!fs.existsSync(dbFile)) {
  try {
    const bundledDbPath = isDev
      ? path.join(__dirname, '../server/prisma/pos.db')
      : path.join(process.resourcesPath, 'app.asar.unpacked/server/prisma/pos.db');

    if (fs.existsSync(bundledDbPath)) {
      console.log(`Bootstrapping database: Copying ${bundledDbPath} to ${dbFile}`);
      fs.copyFileSync(bundledDbPath, dbFile);
      fs.accessSync(dbFile, fs.constants.R_OK | fs.constants.W_OK);
      console.log('Database file access verified.');
    } else {
      console.error('Warning: Bundled database template not found at:', bundledDbPath);
    }
  } catch (error) {
    console.error('Failed to bootstrap database:', error);
  }
}

const formattedDbPath = dbFile.replace(/\\/g, '/');
process.env.DATABASE_URL = process.platform === 'win32'
  ? `file:${formattedDbPath}`
  : `file://${formattedDbPath}`;

process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

const engineDir = isDev
  ? path.join(__dirname, '../node_modules/.prisma/client')
  : path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/.prisma/client');

const possibleEngineNames = process.platform === 'win32'
  ? ['query_engine-windows.dll.node', 'libquery_engine-windows.dll.node']
  : ['libquery_engine-darwin-arm64.dylib.node', 'libquery_engine-darwin.dylib.node'];

let enginePath = null;
for (const name of possibleEngineNames) {
  const p = path.join(engineDir, name);
  if (fs.existsSync(p)) {
    enginePath = p;
    break;
  }
}

if (enginePath) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
  console.log('Prisma Engine Path detected:', enginePath);
}

const createWindow = () => {
  const iconPath = path.join(__dirname, '../assets/shop_logo.jpeg');
  const windowConfig = {
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  };

  if (fs.existsSync(iconPath)) {
    windowConfig.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowConfig);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  mainWindow.setTitle('Bachat Bazaar - POS Application');

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const startServer = () => {
  return new Promise((resolve, reject) => {
    try {
      process.env.PORT = SERVER_PORT;
      process.env.NODE_ENV = isDev ? 'development' : 'production';

      const serverDir = isDev
        ? path.resolve(__dirname, '../server')
        : path.resolve(process.resourcesPath, 'app.asar.unpacked/server');

      const wrapperPath = path.resolve(__dirname, 'server-wrapper.js');

      console.log(`Starting server from: ${serverDir}`);

      process.chdir(serverDir);

      module.paths.unshift(path.join(serverDir, 'node_modules'));
      module.paths.unshift(path.join(__dirname, '../node_modules'));

      try {
        require(wrapperPath);
        setTimeout(() => {
          resolve();
        }, 500);
      } catch (error) {
        console.error('Failed to start server:', error);
        reject(error);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const stopServer = () => {
  console.log('Server will be stopped when app closes');
};

app.on('ready', async () => {
  try {
    const template = [
      {
        label: 'File',
        submenu: [{ role: 'quit' }]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(process.platform === 'darwin' ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ] : [
            { role: 'close' }
          ])
        ]
      },
      {
        label: 'Debug',
        submenu: [
          {
            label: 'Wipe App Data (Restart Required)',
            click: async () => {
              const choice = dialog.showMessageBoxSync(mainWindow, {
                type: 'warning',
                buttons: ['Cancel', 'Wipe Data'],
                defaultId: 0,
                title: 'Confirm Wipe',
                message: 'This will delete ALL local data, products, and logs. The application will restart automatically. Continue?',
                cancelId: 0
              });

              if (choice === 1) {
                try {
                  stopServer();
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const files = fs.readdirSync(appDataPath);
                  for (const file of files) {
                    const fullPath = path.join(appDataPath, file);
                    try {
                      fs.rmSync(fullPath, { recursive: true, force: true });
                    } catch (e) {
                      console.error(`Could not delete ${file}:`, e.message);
                    }
                  }
                  app.relaunch();
                  app.exit(0);
                } catch (err) {
                  dialog.showErrorBox('Wipe Failed', `A critical error occurred: ${err.message}`);
                }
              }
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'System Diagnostic',
            click: () => {
              const info = `User Data Path: ${appDataPath}\nDatabase URL: ${process.env.DATABASE_URL}\nPlatform: ${process.platform}\nVersion: ${app.getVersion()}`;
              dialog.showMessageBoxSync(mainWindow, {
                type: 'info',
                title: 'System Diagnostic',
                message: 'Bachat Bazaar Diagnostics',
                detail: info,
                buttons: ['OK']
              });
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Server Error', `Failed to start: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopServer();
});