const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');

// -------------------------------------------------------------------------
// 1. EMERGENCY ERROR HANDLING (MUST BE FIRST)
// -------------------------------------------------------------------------
const showFatalError = (error, type = 'Uncaught Exception') => {
  const message = error instanceof Error ? error.stack : String(error);
  console.error(`[FATAL] ${type}:`, message);
  if (app.isReady()) {
    try {
      dialog.showErrorBox(`A ${type} occurred in the main process`, message);
    } catch (e) { }
  } else {
    try {
      // Some platforms support dialog before ready, some don't
      dialog.showErrorBox(`A ${type} occurred`, message);
    } catch (e) { }
  }
};

process.on('uncaughtException', (error) => showFatalError(error, 'Uncaught Exception'));
process.on('unhandledRejection', (reason) => showFatalError(reason, 'Unhandled Rejection'));

// -------------------------------------------------------------------------
// 2. INITIALIZATION & METADATA
// -------------------------------------------------------------------------
app.setName('Bachat Bazaar');
app.setAppUserModelId('com.bachatbazaar.pos');

const isDev = !app.isPackaged;
const SERVER_PORT = 5001;

let mainWindow;
let serverProcess;

// -------------------------------------------------------------------------
// 3. SAFE LOGGING SETUP
// -------------------------------------------------------------------------
const appDataPath = app.getPath('userData');
const logFile = path.join(appDataPath, 'app.log');

if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

let logStream;
try {
  logStream = fs.createWriteStream(logFile, { flags: 'a' });
} catch (e) {
  // Can't log to file if this fails, but should not crash the app
}

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const logToFile = (prefix, args) => {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] [${prefix}] ` + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') + '\n';
  if (logStream) {
    try { logStream.write(msg); } catch (e) { }
  }
};

console.log = (...args) => {
  logToFile('LOG', args);
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  logToFile('ERROR', args);
  originalConsoleError.apply(console, args);
};

console.log('----------------------------------------------------');
console.log(`Application starting: ${new Date().toISOString()}`);
console.log(`Platform: ${process.platform}, Arch: ${process.arch}`);
console.log(`App path: ${app.getAppPath()}`);
console.log('----------------------------------------------------');

// --- 4. IPC HANDLERS ---
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});
ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
});

// -------------------------------------------------------------------------
// DATABASE BOOTSTRAPPING
// -------------------------------------------------------------------------
// On fresh installs, we need to copy our bundled schema-ready pos.db 
// from the application resources to the user's data directory.
const dbFile = path.join(appDataPath, 'pos.db');

// Ensure the directory exists before any file operations
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

if (!fs.existsSync(dbFile)) {
  try {
    const rootPath = app.getAppPath();
    const bundledDbPath = isDev
      ? path.join(__dirname, '../server/prisma/pos.db')
      : path.join(rootPath, '..', 'app.asar.unpacked/server/prisma/pos.db');

    if (fs.existsSync(bundledDbPath)) {
      console.log(`Bootstrapping database: Copying ${bundledDbPath} to ${dbFile}`);
      fs.copyFileSync(bundledDbPath, dbFile);

      // Verification check: ensure we can actually read/write to the file
      fs.accessSync(dbFile, fs.constants.R_OK | fs.constants.W_OK);
      console.log('Database file access verified.');
    } else {
      console.error('Warning: Bundled database template not found at:', bundledDbPath);
    }
  } catch (error) {
    console.error('Failed to bootstrap database:', error);
  }
}

// Set environment variable for Prisma DB path using a robust literal format.
// URL encoding (pathToFileURL) can turn spaces into %20, which Prisma/SQLite 
// sometimes fails to decode correctly on Windows.
// Standardizing on 'file:C:/path' for Windows and 'file:///path' for Unix.
const formattedDbPath = dbFile.replace(/\\/g, '/');
process.env.DATABASE_URL = process.platform === 'win32'
  ? `file:${formattedDbPath}`
  : `file://${formattedDbPath}`;

// Ensure Prisma uses the engine library
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

// Explicitly set the path to the Prisma Query Engine binary for the packaged environment
const engineDir = isDev
  ? path.join(__dirname, '../node_modules/.prisma/client')
  : path.join(app.getAppPath(), '..', 'app.asar.unpacked/node_modules/.prisma/client');

// Windows often uses .dll.node for the library engine, but we check both common names
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
} else {
  console.error('CRITICAL: Prisma Query Engine not found in:', engineDir);
}

console.log('---------------------------------------------------');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Prisma Engine Path set to:', process.env.PRISMA_QUERY_ENGINE_LIBRARY || 'default');
console.log('---------------------------------------------------');

const createWindow = () => {
  // Use shop_logo.jpeg for app icon
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

  // Only add icon if it exists
  if (fs.existsSync(iconPath)) {
    windowConfig.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowConfig);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  // Set window title
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
      // Set server port and environment
      process.env.PORT = SERVER_PORT;
      process.env.NODE_ENV = isDev ? 'development' : 'production';

      const rootPath = app.getAppPath();
      const serverDir = isDev
        ? path.resolve(__dirname, '../server')
        : path.resolve(rootPath, '..', 'app.asar.unpacked/server');

      const wrapperPath = path.resolve(__dirname, 'server-wrapper.js');

      console.log(`Starting server from: ${serverDir}`);
      console.log(`Wrapper: ${wrapperPath}`);

      // Ensure the directory exists before chdir
      if (!fs.existsSync(serverDir)) {
        throw new Error(`Server directory not found: ${serverDir}`);
      }

      // Change to server directory so relative paths work
      process.chdir(serverDir);

      // Add search paths for module resolution
      module.paths.unshift(path.join(serverDir, 'node_modules'));
      module.paths.unshift(path.join(__dirname, '../node_modules'));

      // Load and start the server
      try {
        require(wrapperPath);

        // Wait a tiny bit for server to start listening
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
  // Server is running within the Electron process, no need to stop
  console.log('Server will be stopped when app closes');
};

// App metadata moved to top for correct directory resolution

app.on('ready', async () => {
  try {
    // Create Application Menu
    const template = [
      {
        label: 'File',
        submenu: [
          { role: 'quit' }
        ]
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
                  console.log('Initiating full data wipe...');

                  // 1. Attempt to stop server to release file locks
                  stopServer();

                  // 2. Small delay to ensure hooks are released
                  await new Promise(resolve => setTimeout(resolve, 1000));

                  // 3. Recursive delete of everything in userData
                  // We use rmSync with recursive: true to handle subdirectories
                  // force: true ignores errors if file is missing
                  const files = fs.readdirSync(appDataPath);
                  for (const file of files) {
                    const fullPath = path.join(appDataPath, file);
                    try {
                      fs.rmSync(fullPath, { recursive: true, force: true });
                      console.log(`Deleted: ${fullPath}`);
                    } catch (e) {
                      console.error(`Could not delete ${file}:`, e.message);
                    }
                  }

                  // 4. Relaunch
                  app.relaunch();
                  app.exit(0);
                } catch (err) {
                  dialog.showErrorBox('Wipe Failed', `A critical error occurred: ${err.message}\n\nPlease try manually deleting the folder: ${appDataPath}`);
                }
              }
            }
          },
          { type: 'separator' },
          { role: 'toggleDevTools' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'System Diagnostic',
            click: () => {
              const info = `
User Data Path: ${appDataPath}
Database URL: ${process.env.DATABASE_URL}
Prisma Engine: ${process.env.PRISMA_QUERY_ENGINE_LIBRARY || 'default'}
Platform: ${process.platform}
Architecture: ${process.arch}
Version: ${app.getVersion()}

--- RECENT LOGS ---
${(() => {
                  try {
                    if (fs.existsSync(logFile)) {
                      const logs = fs.readFileSync(logFile, 'utf8');
                      const lines = logs.split('\n').filter(Boolean);
                      return lines.slice(-150).join('\n');
                    }
                    return 'No log file found.';
                  } catch (e) {
                    return 'Error reading logs: ' + e.message;
                  }
                })()}
              `.trim();
              dialog.showMessageBoxSync(mainWindow, {
                type: 'info',
                title: 'System Diagnostic',
                message: 'Bachat Bazaar Diagnostics',
                detail: info,
                buttons: ['OK']
              });
            }
          },
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'F12',
            click: () => {
              if (mainWindow) mainWindow.webContents.toggleDevTools();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Initialise Auto-updater
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', () => {
      if (mainWindow) mainWindow.webContents.send('update-available');
    });
    autoUpdater.on('update-downloaded', () => {
      if (mainWindow) mainWindow.webContents.send('update-downloaded');
    });
    autoUpdater.on('error', (err) => {
      if (mainWindow) mainWindow.webContents.send('update-error', err.message);
    });

    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    const message = error.message || error.toString();
    dialog.showErrorBox(
      'Server Error',
      `Failed to start the application server.\n\nDetails: ${message}\n\nPlease check the console logs for more information.`
    );
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