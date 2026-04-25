// Electron and core imports FIRST
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  screen,
  shell,
  webContents,
} = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');
const net = require('net');

// Catch any unhandled error in the main process so the app never silently disappears.
// Log to file and show a dialog so the user knows something went wrong.
process.on('uncaughtException', (err) => {
  const msg = `[${new Date().toISOString()}] [FATAL] uncaughtException: ${err.stack || err.message}\n`;
  try { logStream.write(msg); } catch (_) {}
  console.error('[FATAL] uncaughtException:', err);
  try {
    dialog.showErrorBox(
      'Unexpected Error',
      `The application encountered an unexpected error and needs attention.\n\nDetails: ${err.message}\n\nCheck Help → System Diagnostic for recent logs.`
    );
  } catch (_) {}
});

process.on('unhandledRejection', (reason) => {
  const msg = `[${new Date().toISOString()}] [FATAL] unhandledRejection: ${reason}\n`;
  try { logStream.write(msg); } catch (_) {}
  console.error('[FATAL] unhandledRejection:', reason);
});

// Auto-update wiring is done inside the second app.on('ready') handler,
// after createWindow(), so mainWindow is guaranteed to exist when events fire.

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-metadata', () => {
  const version = app.getVersion();
  // Get last modified time of the executable or app bundle
  let lastUpdate = 'Unknown';
  try {
    const exePath = app.getPath('exe');
    const stats = fs.statSync(exePath);
    lastUpdate = stats.mtime.toLocaleDateString();
  } catch (e) {
    console.error('Failed to get last update date:', e);
  }
  return { version, lastUpdate };
});
ipcMain.handle('get-app-path', () => appDataPath);
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});
ipcMain.on('start-download', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('restart-app', () => {
  // Silent install mode, force restart after finish
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('print-manual', (_event, { printerName }) => {
  if (!mainWindow) return { success: false, error: 'App window not ready' };
  console.log(`[PRINT] Direct Printing to: ${printerName || 'System Default'}`);

  return new Promise((resolve) => {
    // silent: true — no OS print dialog, no interruption to the cashier flow
    mainWindow.webContents.print(
      {
        silent: true,
        deviceName: printerName || undefined,
        printBackground: true,
        color: true,
        margins: { marginType: 'none' }, // CRITICAL: Disable margins to prevent clipping or shrinking
        scaleFactor: 100,
      },
      (success, failureReason) => {
        if (!success) {
          console.error(`[PRINT ERROR] Failed to print: ${failureReason}`);
          resolve({ success: false, error: failureReason || 'Unknown print error' });
        } else {
          console.log('[PRINT SUCCESS] Direct print sent to printer.');
          resolve({ success: true });
        }
      }
    );
  });
});

ipcMain.handle('print-html-content', async (event, { html, printerName, pageSize }) => {
  let printWindow;

  try {
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid printable HTML payload.');
    }

    printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    const htmlUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    // loadURL resolves after dom-ready; one rAF-equivalent tick lets Chromium
    // finish painting SVG barcodes before the print job is submitted.
    await printWindow.loadURL(htmlUrl);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const printOptions = {
      silent: true,
      deviceName: printerName || undefined,
      printBackground: true,
      color: true,
      margins: { marginType: 'none' },
      scaleFactor: 100,
    };

    if (pageSize && Number(pageSize.widthMicrons) > 0 && Number(pageSize.heightMicrons) > 0) {
      printOptions.pageSize = {
        width: Math.round(Number(pageSize.widthMicrons)),
        height: Math.round(Number(pageSize.heightMicrons)),
      };
    }

    const result = await new Promise((resolve) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        resolve({ success, failureReason });
      });
    });

    if (!result.success) {
      throw new Error(result.failureReason || 'Unknown print failure');
    }

    return { success: true };
  } catch (error) {
    console.error('[PRINT HTML ERROR] Failed to print HTML content:', error);
    throw error;
  } finally {
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
});

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
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  const msg =
    `[${new Date().toISOString()}] [LOG] ` +
    args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') +
    '\n';
  logStream.write(msg);
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  const msg =
    `[${new Date().toISOString()}] [ERROR] ` +
    args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') +
    '\n';
  logStream.write(msg);
  originalConsoleError.apply(console, args);
};

console.log('App initialization started');
console.log('Log file:', logFile);

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

// Get file size helper
const getFileSize = (filePath) => {
  try {
    return fs.statSync(filePath).size;
  } catch (e) {
    return 0;
  }
};

// CRITICAL FIX: Only skip bootstrap if file exists AND is large enough to have a schema (~200KB expected)
// If it's less than 5KB (was 50KB), it's likely an empty or fresh SQLite file and needs overwriting.
const shouldBootstrap = !fs.existsSync(dbFile) || getFileSize(dbFile) < 5 * 1024;

if (shouldBootstrap) {
  try {
    const bundledDbPath = isDev
      ? path.join(__dirname, '../server/prisma/pos.db')
      : path.join(process.resourcesPath, 'app.asar.unpacked/server/prisma/pos.db');

    console.log('Database status: ' + (!fs.existsSync(dbFile) ? 'Missing' : 'Empty/Corrupt'));

    if (fs.existsSync(bundledDbPath)) {
      console.log(`Bootstrapping database: Copying ${bundledDbPath} to ${dbFile}`);
      fs.copyFileSync(bundledDbPath, dbFile);

      // Verification check: ensure we can actually read/write to the file
      fs.accessSync(dbFile, fs.constants.R_OK | fs.constants.W_OK);
      console.log('Database file size after bootstrap:', getFileSize(dbFile));
      console.log('Database file access verified.');
    } else {
      console.error('CRITICAL: Bundled database template not found at:', bundledDbPath);
    }
  } catch (error) {
    console.error('Failed to bootstrap database:', error);
  }
} else {
  console.log('Database exists and is non-empty. Size:', getFileSize(dbFile));
}

// Set environment variable for Prisma DB path using a robust literal format.
// URL encoding (pathToFileURL) can turn spaces into %20, which Prisma/SQLite
// sometimes fails to decode correctly on Windows.
// Standardizing on 'file:C:/path' for Windows and 'file:///path' for Unix.
const formattedDbPath = dbFile.replace(/\\/g, '/');
process.env.DATABASE_URL =
  process.platform === 'win32' ? `file:${formattedDbPath}` : `file://${formattedDbPath}`;

// Ensure Prisma uses the engine library
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

// Explicitly set the path to the Prisma Query Engine binary for the packaged environment
const engineDir = isDev
  ? path.join(__dirname, '../node_modules/.prisma/client')
  : path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/.prisma/client');

// Windows often uses .dll.node for the library engine, but we check both common names
const possibleEngineNames =
  process.platform === 'win32'
    ? ['query_engine-windows.dll.node', 'libquery_engine-windows.dll.node']
    : [
        'libquery_engine-darwin-arm64.dylib.node',  // Apple Silicon
        'libquery_engine-darwin-x64.dylib.node',    // Intel Mac
        'libquery_engine-darwin.dylib.node',         // legacy fallback
      ];

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

let splashWindow;

const createWindow = () => {
  // Use shop_logo.jpeg for app icon
  const iconPath = path.join(__dirname, '../assets/shop_logo.jpeg');

  // 1. Create Splash Window
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Needed for simple IPC in splash
    },
  });

  const splashUrl = url.format({
    pathname: path.join(__dirname, 'splash/splash.html'),
    protocol: 'file:',
    slashes: true,
  });

  splashWindow.loadURL(splashUrl);

  splashWindow.webContents.on('did-finish-load', () => {
    splashWindow.webContents.send('splash-version', app.getVersion());
  });

  // 2. Create hidden Main Window
  const windowConfig = {
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  };

  if (fs.existsSync(iconPath)) {
    windowConfig.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowConfig);
  mainWindow.setTitle('Bachat Bazaar - POS Application');

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 3. Start Server then load Main Window
  const startUrl = isDev
    ? 'http://localhost:5173'
    : url.format({
        pathname: path.resolve(__dirname, '../client/dist/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // 4. Intercept simulated IPC for Splash Screen
  process.send = (msg) => {
    if (msg && msg.type === 'splash-status' && splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send('splash-status', msg.message);
    }
  };

  startServer()
    .then(() => {
      console.log('Server started, loading frontend...');
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('splash-status', 'Loading User Interface...');
      }
      mainWindow.loadURL(startUrl);
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      dialog.showErrorBox(
        'Server Error',
        `Background server failed to start.\n\nDetails: ${err.message}`
      );
      if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    });
};

const checkPort = (port) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(200);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, '127.0.0.1', () => {
      socket.destroy();
      resolve(true);
    });
  });
};

const waitForServer = async (port, timeout = 90000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const isReady = await checkPort(port);
    if (isReady) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
};

const startServer = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Set server port and environment
      process.env.PORT = SERVER_PORT;
      process.env.NODE_ENV = isDev ? 'development' : 'production';

      const serverDir = isDev
        ? path.resolve(__dirname, '../server')
        : path.resolve(process.resourcesPath, 'app.asar.unpacked/server');

      const wrapperPath = path.resolve(__dirname, 'server-wrapper.js');

      console.log(`Starting server from: ${serverDir}`);
      console.log(`Wrapper: ${wrapperPath}`);
      console.log(`Database path: ${process.env.DATABASE_URL}`);

      // Change to server directory so relative paths work
      process.chdir(serverDir);

      // Add search paths for module resolution
      module.paths.unshift(path.join(serverDir, 'node_modules'));
      module.paths.unshift(path.join(__dirname, '../node_modules'));

      // Load and start the server
      try {
        require(wrapperPath);

        // Wait for server to actually start listening
        console.log(`Polling port ${SERVER_PORT}...`);
        const ready = await waitForServer(SERVER_PORT);
        if (ready) {
          console.log(`Server is ready on port ${SERVER_PORT}`);
          resolve();
        } else {
          reject(new Error(`Server timed out after waiting for port ${SERVER_PORT}`));
        }
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
        submenu: [{ role: 'quit' }],
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
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(process.platform === 'darwin'
            ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
            : [{ role: 'close' }]),
        ],
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
                message:
                  'This will delete ALL local data, products, and logs. The application will restart automatically. Continue?',
                cancelId: 0,
              });

              if (choice === 1) {
                try {
                  console.log('Initiating full data wipe...');

                  // 1. Attempt to stop server to release file locks
                  stopServer();

                  // 2. Small delay to ensure hooks are released
                  await new Promise((resolve) => setTimeout(resolve, 1000));

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
                  dialog.showErrorBox(
                    'Wipe Failed',
                    `A critical error occurred: ${err.message}\n\nPlease try manually deleting the folder: ${appDataPath}`
                  );
                }
              }
            },
          },
          { type: 'separator' },
          { role: 'toggleDevTools' },
        ],
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
                buttons: ['OK'],
              });
            },
          },
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'F12',
            click: () => {
              if (mainWindow) mainWindow.webContents.toggleDevTools();
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    createWindow();

    // Auto-update setup runs here so mainWindow exists when events fire.
    try {
      autoUpdater.checkForUpdatesAndNotify();
      autoUpdater.on('update-available', () => {
        if (mainWindow) mainWindow.webContents.send('update-available');
      });
      autoUpdater.on('update-downloaded', () => {
        if (mainWindow) mainWindow.webContents.send('update-downloaded');
      });
      autoUpdater.on('update-not-available', () => {
        if (mainWindow) mainWindow.webContents.send('update-not-available');
      });
      autoUpdater.on('error', (err) => {
        if (mainWindow) mainWindow.webContents.send('update-error', err.message);
      });
      autoUpdater.on('download-progress', (progressObj) => {
        if (mainWindow) mainWindow.webContents.send('download-progress', progressObj.percent);
      });
    } catch (updateErr) {
      console.error('Failed to start auto-update setup:', updateErr);
    }
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
