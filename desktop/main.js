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

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const Sentry = require("@sentry/electron/main");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: `trovix@${app.getVersion()}`,
    environment: process.env.NODE_ENV || "production",
  });
}

const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const os = require('os');
const url = require('url');
const net = require('net');
const http = require('http');
const IPC = require('./ipcChannels');

// Catch any unhandled error in the main process so the app never silently disappears.
// Log to file and show a dialog so the user knows something went wrong.
process.on('uncaughtException', (err) => {
  const msg = `[${new Date().toISOString()}] [FATAL] uncaughtException: ${err.stack || err.message}\n`;
  try { logStream.write(msg); } catch (_) { }
  console.error('[FATAL] uncaughtException:', err);
  try {
    dialog.showErrorBox(
      'Unexpected Error',
      `The application encountered an unexpected error and needs attention.\n\nDetails: ${err.message}\n\nCheck Help → System Diagnostic for recent logs.`
    );
  } catch (_) { }
});

process.on('unhandledRejection', (reason) => {
  const msg = `[${new Date().toISOString()}] [FATAL] unhandledRejection: ${reason}\n`;
  try { logStream.write(msg); } catch (_) { }
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

// Generic IPC bridge: forwards any renderer API call to the in-process Express
// server via a loopback HTTP request. All middleware (helmet, rate-limit, Joi
// validation, pino logging, error handler) fires normally.
// Only used in production — the dev renderer uses Vite's axios HTTP proxy.
ipcMain.handle('api-bridge', (_event, { method = 'GET', url, body, params, headers = {} }) => {
  return new Promise((resolve) => {
    let fullPath = url;
    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString();
      fullPath = `${url}?${qs}`;
    }

    // axios's transformRequest already JSON-stringifies the body before calling a
    // custom adapter. Avoid double-encoding: if body is already a string, use it
    // directly; if it's an object (non-standard path), stringify it ourselves.
    const bodyStr = body == null ? null : typeof body === 'string' ? body : JSON.stringify(body);
    const reqHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };
    // Never forward Origin — Express CORS allows requests with no Origin header.
    delete reqHeaders['origin'];
    delete reqHeaders['Origin'];
    if (bodyStr) reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);

    const options = {
      hostname: '127.0.0.1',
      port: SERVER_PORT,
      path: fullPath,
      method: method.toUpperCase(),
      headers: reqHeaders,
    };

    const httpReq = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let data;
        try { data = JSON.parse(raw); } catch { data = raw; }
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    // 15-second guard so a hung Express handler can't lock the renderer.
    httpReq.setTimeout(15000, () => {
      httpReq.destroy();
      resolve({ status: 503, data: { message: 'IPC bridge: request timed out' }, headers: {} });
    });

    httpReq.on('error', (err) => {
      resolve({ status: 503, data: { message: `IPC bridge error: ${err.message}` }, headers: {} });
    });

    if (bodyStr) httpReq.write(bodyStr);
    httpReq.end();
  });
});

// Maps Chromium's internal print result codes to user-readable messages.
// Source: chromium/src/printing/print_job.h PrintResult enum
const PRINT_ERROR_MESSAGES = {
  1: 'Print job failed. Check that the printer is turned on and has paper.',
  2: 'Invalid printer settings. Try selecting the printer again in Receipt Settings.',
  3: 'Print was cancelled.',
  4: 'Print job crashed internally. Please try again.',
  5: 'Printer not found. The configured printer may be offline, renamed, or disconnected. Go to Settings → Receipt Settings to reselect your printer.',
  6: 'File system error during printing.',
};

function describePrintError(failureReason) {
  if (!failureReason) return 'Unknown print error';
  const codeMatch = String(failureReason).match(/Error code:\s*(\d+)/i);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], 10);
    return PRINT_ERROR_MESSAGES[code] || `Print failed (code ${code})`;
  }
  return failureReason;
}

ipcMain.handle('print-manual', async (_event, { printerName }) => {
  if (!mainWindow) return { success: false, error: 'App window not ready' };
  console.log(`[PRINT] Direct Printing to: ${printerName || 'System Default'}`);

  // Validate printer availability before submitting the job
  if (printerName) {
    try {
      const available = await mainWindow.webContents.getPrintersAsync();
      const found = available.some((p) => p.name === printerName);
      if (!found) {
        const names = available.map((p) => p.name).join(', ') || 'none';
        console.error(`[PRINT ERROR] Printer "${printerName}" not found. Available: ${names}`);
        return {
          success: false,
          error: `Printer "${printerName}" is not available. Go to Settings → Receipt Settings to reselect your printer. Available printers: ${names}`,
        };
      }
    } catch (err) {
      console.warn('[PRINT] Could not validate printer list:', err.message);
    }
  }

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
          const message = describePrintError(failureReason);
          console.error(`[PRINT ERROR] ${failureReason} → ${message}`);
          resolve({ success: false, error: message });
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
      throw new Error(describePrintError(result.failureReason));
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
// -------------------------------------------------------------------------
// APP IDENTITY
// -------------------------------------------------------------------------
// Set app name and ID early, but we will handle path-sensitive migration inside whenReady
app.setName('Trovix');
app.setAppUserModelId('com.bachatbazaar.pos');

// Check if running in development mode
const isDev = !app.isPackaged;

// -------------------------------------------------------------------------
// ONE-TIME MIGRATION LOGIC
// -------------------------------------------------------------------------
function handleDataMigration() {
  try {
    const appData = app.getPath('appData');
    const oldAppDataPath = path.join(appData, 'Bachat Bazaar');
    const newAppDataPath = path.join(appData, 'Trovix');
    const oldDbFile = path.join(oldAppDataPath, 'pos.db');
    const newDbFile = path.join(newAppDataPath, 'pos.db');

    if (fs.existsSync(oldDbFile) && !fs.existsSync(newDbFile)) {
      if (!fs.existsSync(newAppDataPath)) {
        fs.mkdirSync(newAppDataPath, { recursive: true });
      }
      fs.copyFileSync(oldDbFile, newDbFile);
      console.log('[Migration] pos.db successfully migrated from Bachat Bazaar to Trovix');
    }
  } catch (err) {
    console.error('[Migration] Non-fatal migration error:', err.message);
  }
}

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
    console.log('Splash screen loaded successfully');
    splashWindow.webContents.send(IPC.SPLASH_VERSION, app.getVersion());
  });

  splashWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Splash screen failed to load: ${errorCode} - ${errorDescription}`);
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
  mainWindow.setTitle('Trovix - POS Application');

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

  // Gate: show main window only when BOTH server is ready AND frontend is loaded.
  // Both start in parallel so total wait = max(server_time, frontend_time) not the sum.
  let serverReady = false;
  let frontendReady = false;

  const tryShowWindow = () => {
    if (!serverReady || !frontendReady) return;
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once('ready-to-show', () => {
    frontendReady = true;
    tryShowWindow();
  });

  // 4. Intercept simulated IPC for Splash Screen
  process.send = (msg) => {
    if (msg && msg.type === IPC.SPLASH_STATUS && splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send(IPC.SPLASH_STATUS, msg.message);
    }
  };

  // Load frontend immediately (behind the splash) while the server boots in parallel.
  mainWindow.loadURL(startUrl);

  startServer()
    .then(() => {
      console.log('Server ready — waiting for frontend...');
      serverReady = true;
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send(IPC.SPLASH_STATUS, 'Loading User Interface...');
      }
      tryShowWindow();
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
  let attempts = 0;
  while (Date.now() - start < timeout) {
    attempts++;
    const isReady = await checkPort(port);
    if (isReady) {
      console.log(`Server ready on port ${port} after ${Date.now() - start}ms`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.error(`Server timed out waiting for port ${port} (${attempts} attempts, ${Date.now() - start}ms)`);
  return false;
};

const startServer = () => {
  return new Promise(async (resolve, reject) => {
    try {
      process.env.PORT = SERVER_PORT;
      process.env.NODE_ENV = isDev ? 'development' : 'production';
      const serverDir = isDev
        ? path.resolve(__dirname, '../server')
        : path.resolve(process.resourcesPath, 'app.asar.unpacked/server');

      const wrapperPath = path.resolve(__dirname, 'server-wrapper.js');

      // Change to server directory so relative paths work
      process.chdir(serverDir);

      // Add search paths for module resolution
      module.paths.unshift(path.join(serverDir, 'node_modules'));
      module.paths.unshift(path.join(__dirname, '../node_modules'));

      const alreadyOpen = await checkPort(SERVER_PORT);
      if (alreadyOpen) {
        console.warn(`Port ${SERVER_PORT} already in use before server start — possible zombie process`);
      }

      try {
        require(wrapperPath);
        const ready = await waitForServer(SERVER_PORT);
        if (ready) {
          resolve();
        } else {
          reject(new Error(`Server timed out after waiting for port ${SERVER_PORT}`));
        }
      } catch (error) {
        console.error('Error starting server:', error);
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
                message: 'Trovix Diagnostics',
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

    // 1. Handle any data migration from old app
    handleDataMigration();

    // 2. Start UI
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
