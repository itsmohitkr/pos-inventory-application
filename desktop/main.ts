// Electron and core imports FIRST
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  screen,
  session,
  shell,
  webContents,
} from 'electron';

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../server/.env') });
import * as Sentry from '@sentry/electron/main';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: `trovix@${app.getVersion()}`,
    environment: process.env.NODE_ENV || 'production',
  });
}

import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import os from 'os';
import url from 'url';
import net from 'net';
import http from 'http';
import IPC = require('./ipcChannels');

// Catch any unhandled error in the main process so the app never silently disappears.
// Log to file and show a dialog so the user knows something went wrong.
process.on('uncaughtException', (err: Error) => {
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

process.on('unhandledRejection', (reason: unknown) => {
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
  // Always resolves to an array. This used to return [] when there was no
  // window but reject if getPrintersAsync() failed, so callers had to handle
  // the same condition two different ways.
  const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  if (!win) return [];
  try {
    return await win.webContents.getPrintersAsync();
  } catch (err) {
    console.error('[PRINT] Could not enumerate printers:', err instanceof Error ? err.message : err);
    return [];
  }
});

interface ApiBridgeRequest {
  method?: string;
  url: string;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

// Generic IPC bridge: forwards any renderer API call to the in-process Express
// server via a loopback HTTP request. All middleware (helmet, rate-limit, Joi
// validation, pino logging, error handler) fires normally.
// Only used in production — the dev renderer uses Vite's axios HTTP proxy.
ipcMain.handle('api-bridge', (_event, { method = 'GET', url, body, params, headers = {} }: ApiBridgeRequest) => {
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
    const reqHeaders: Record<string, string | number> = {
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
      const chunks: Buffer[] = [];
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

/** Every print IPC handler resolves with this shape. Never throws. */
interface PrintResult {
  success: boolean;
  error?: string;
}

/**
 * How long to wait for Chromium's print callback before giving up.
 *
 * The callback fires when the job is handed to the OS spooler, not when ink
 * hits paper, so a healthy printer answers in well under a second. This is
 * set deliberately long anyway: the only job of this timeout is to stop an
 * indefinite hang (see printWithTimeout), and any finite value does that,
 * whereas a value that is too short would report a false failure for a job
 * that actually printed — on a busy Windows spooler with a large label batch
 * that is a real possibility. Cheap to be generous; expensive to be wrong.
 */
const PRINT_TIMEOUT_MS = 60_000;

/**
 * Guard for BrowserWindow.loadURL, which can also hang on a bad payload.
 * Generous for the same reason as PRINT_TIMEOUT_MS: parsing a large batch of
 * inlined SVG labels is legitimately slow on modest hardware, and a premature
 * abort would fail a job that was about to succeed.
 */
const PRINT_LOAD_TIMEOUT_MS = 30_000;

// Descriptive-string matches come FIRST because that is what Electron actually
// passes. Verified against the pinned Electron (40.4.0) by calling print()
// with a bad deviceName — the observed strings are:
//   "Invalid deviceName provided"          (printer name not recognised)
//   "No printers available on the network" (nothing installed at all)
// Neither is of the `Error code: N` form the numeric table below was built
// for, so that table never fired and this function used to return the raw
// Chromium string to the cashier. It is kept only as a fallback for other or
// older Electron builds. Re-run the probe if Electron is upgraded.
const PRINT_ERROR_PATTERNS: { match: RegExp; message: string }[] = [
  {
    match: /no valid printers|no printers available|printer not found|invalid devicename/i,
    message:
      'Printer not found. It may be offline, renamed, or disconnected. Go to Settings → Receipt Settings to reselect your printer.',
  },
  {
    match: /cancel/i,
    message: 'Print was cancelled.',
  },
  {
    match: /invalid (printer|print job) settings/i,
    message:
      'Invalid printer settings. Try selecting the printer again in Settings → Receipt Settings.',
  },
  {
    match: /access denied|restricted|permission/i,
    message:
      'Printing was blocked by system permissions. Check that this user is allowed to print to the selected printer.',
  },
  {
    match: /fail|error/i,
    message: 'Print job failed. Check that the printer is on, connected, and has paper.',
  },
];

// Legacy `Error code: N` mapping. Source: chromium/src/printing/print_job.h
// PrintResult enum (older revisions — current Chromium uses mojom::ResultCode).
const PRINT_ERROR_MESSAGES: Record<number, string> = {
  1: 'Print job failed. Check that the printer is turned on and has paper.',
  2: 'Invalid printer settings. Try selecting the printer again in Receipt Settings.',
  3: 'Print was cancelled.',
  4: 'Print job crashed internally. Please try again.',
  5: 'Printer not found. The configured printer may be offline, renamed, or disconnected. Go to Settings → Receipt Settings to reselect your printer.',
  6: 'File system error during printing.',
};

/**
 * Turns a print failure into something a cashier can act on.
 *
 * Never returns raw Chromium text: an unrecognised reason falls through to a
 * generic but actionable message, and the verbatim reason goes to the log
 * instead (see the [PRINT ERROR] lines) where support can find it.
 */
function describePrintError(failureReason: string | undefined | null): string {
  if (!failureReason) {
    return 'The printer did not report why the job failed. Check that it is on, connected, and has paper.';
  }
  const reason = String(failureReason);

  const codeMatch = reason.match(/Error code:\s*(\d+)/i);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], 10);
    if (PRINT_ERROR_MESSAGES[code]) return PRINT_ERROR_MESSAGES[code];
  }

  const pattern = PRINT_ERROR_PATTERNS.find((p) => p.match.test(reason));
  if (pattern) return pattern.message;

  return 'Print job failed. Check that the printer is on, connected, and has paper.';
}

/** The main window, but only if it is still usable. */
function liveMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

/**
 * Submits a print job and GUARANTEES the returned promise settles.
 *
 * Chromium's print callback does not always fire — a stalled spooler or a
 * wedged driver can swallow it entirely. Without this guard the renderer's
 * `await invoke(...)` never resolves, and in the POS pay-and-print flow that
 * leaves `isPaying` stuck true, disabling the Pay button until the app is
 * restarted (the sale itself has already committed by then). Mirrors the 15s
 * guard the api-bridge handler above already has.
 *
 * `print()` can also throw synchronously if the webContents was destroyed
 * after the caller's isDestroyed() check, so that path resolves too rather
 * than rejecting — callers rely on the {success,error} contract.
 */
function printWithTimeout(
  contents: Electron.WebContents,
  options: Electron.WebContentsPrintOptions,
  label: string
): Promise<PrintResult> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (result: PrintResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    timer = setTimeout(() => {
      console.error(`[PRINT ERROR] ${label}: no response after ${PRINT_TIMEOUT_MS}ms`);
      settle({
        success: false,
        error:
          'The printer did not respond. It may be offline, out of paper, or stuck — check the printer and try again.',
      });
    }, PRINT_TIMEOUT_MS);

    try {
      contents.print(options, (success, failureReason) => {
        if (success) {
          console.log(`[PRINT SUCCESS] ${label}: job sent to printer.`);
          settle({ success: true });
          return;
        }
        const message = describePrintError(failureReason);
        console.error(`[PRINT ERROR] ${label}: ${failureReason} → ${message}`);
        settle({ success: false, error: message });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[PRINT ERROR] ${label}: print() threw: ${message}`);
      settle({ success: false, error: `Could not start the print job: ${message}` });
    }
  });
}

/** Rejects if `promise` has not settled within `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

interface PrintManualRequest {
  printerName?: string;
}

ipcMain.handle(
  'print-manual',
  async (_event, { printerName }: PrintManualRequest): Promise<PrintResult> => {
    const win = liveMainWindow();
    if (!win) return { success: false, error: 'App window not ready' };
    console.log(`[PRINT] Direct Printing to: ${printerName || 'System Default'}`);

    // Validate printer availability before submitting the job
    if (printerName) {
      try {
        const available = await win.webContents.getPrintersAsync();
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
        console.warn('[PRINT] Could not validate printer list:', err instanceof Error ? err.message : err);
      }
    }

    // Re-check after the await above: the window can close in that gap, and
    // printing through a destroyed webContents would throw instead of
    // returning the {success,error} shape callers depend on.
    const target = liveMainWindow();
    if (!target) {
      return { success: false, error: 'The app window closed before printing could start.' };
    }

    return printWithTimeout(
      target.webContents,
      {
        silent: true, // no OS print dialog, no interruption to the cashier flow
        deviceName: printerName || undefined,
        printBackground: true,
        color: true,
        margins: { marginType: 'none' }, // CRITICAL: Disable margins to prevent clipping or shrinking
        scaleFactor: 100,
      },
      'receipt'
    );
  }
);

interface PrintHtmlContentRequest {
  html: string;
  printerName?: string;
  pageSize?: { widthMicrons?: number; heightMicrons?: number };
}

/**
 * Chromium refuses to navigate to a data: URL beyond roughly 2 MB.
 * Percent-encoding inflates markup 1.5-3x, so a large batch of inlined SVG
 * barcodes can cross that line — which would otherwise surface as a silent
 * blank page rather than an error.
 *
 * Set just under the real cliff rather than comfortably below it. This guard
 * exists to turn an unexplained blank page into a clear message, NOT to
 * impose a new batch limit: a threshold with generous headroom would reject
 * large label runs that print correctly today. Anything over this is going to
 * fail in Chromium anyway.
 */
const MAX_PRINT_DATA_URL_BYTES = 1_950_000;

const PRINT_PARTITION = 'print-isolated';
let printSessionConfigured = false;

/**
 * The print window renders HTML built from database values (product names,
 * prices) that is never sanitised anywhere in the pipeline. Its
 * webPreferences already block Node and enable the sandbox, so script in that
 * page cannot reach the filesystem or IPC — but nothing stopped it reaching
 * the *network*, so a crafted product name containing
 * `<img src="https://attacker/?...">` would beacon out at print time.
 *
 * Confining the window to its own partition lets us block every non-data:
 * request without touching the app's real session, which still needs network
 * access for auto-update.
 */
function configurePrintSession(): void {
  if (printSessionConfigured) return;
  const printSession = session.fromPartition(PRINT_PARTITION);
  printSession.webRequest.onBeforeRequest((details, callback) => {
    const allowed = details.url.startsWith('data:') || details.url.startsWith('about:');
    if (!allowed) {
      console.warn('[PRINT] Blocked non-data request from print window:', details.url);
    }
    callback({ cancel: !allowed });
  });
  printSessionConfigured = true;
}

ipcMain.handle(
  'print-html-content',
  async (
    _event,
    { html, printerName, pageSize }: PrintHtmlContentRequest
  ): Promise<PrintResult> => {
    let printWindow: BrowserWindow | undefined;

    try {
      if (!html || typeof html !== 'string') {
        return { success: false, error: 'Invalid printable HTML payload.' };
      }

      const htmlUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      if (Buffer.byteLength(htmlUrl) > MAX_PRINT_DATA_URL_BYTES) {
        console.error(`[PRINT] Payload too large: ${Buffer.byteLength(htmlUrl)} bytes`);
        return {
          success: false,
          error:
            'Too much content to print in one job. Select fewer items and print in smaller batches.',
        };
      }

      configurePrintSession();
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          partition: PRINT_PARTITION,
        },
      });
      printWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

      // loadURL resolves after dom-ready; one rAF-equivalent tick lets Chromium
      // finish painting SVG barcodes before the print job is submitted.
      await withTimeout(
        printWindow.loadURL(htmlUrl),
        PRINT_LOAD_TIMEOUT_MS,
        'Preparing the print preview timed out.'
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (printWindow.isDestroyed()) {
        return { success: false, error: 'The print preview closed before printing could start.' };
      }

      const printOptions: Electron.WebContentsPrintOptions & { pageSize?: { width: number; height: number } } = {
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

      return await printWithTimeout(printWindow.webContents, printOptions, 'labels');
    } catch (error) {
      // Returns rather than rethrows: this handler used to throw on failure
      // while print-manual returned {success,error}, so callers had to guess
      // which idiom applied. Both now share one contract.
      const message = error instanceof Error ? error.message : String(error);
      console.error('[PRINT HTML ERROR] Failed to print HTML content:', error);
      return { success: false, error: message };
    } finally {
      // Reachable on every path now that printWithTimeout always settles —
      // previously a swallowed print callback leaked this window permanently.
      if (printWindow && !printWindow.isDestroyed()) {
        printWindow.close();
      }
    }
  }
);

// -------------------------------------------------------------------------
// CRITICAL: INITIALIZATION ORDER
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// APP IDENTITY
// -------------------------------------------------------------------------
// Set app name and ID early, but we will handle path-sensitive migration inside whenReady
app.setName('Trovix');
app.setAppUserModelId('com.bachatbazaar.pos');

// Single-instance lock — second launch focuses the existing window instead of opening a new one
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Check if running in development mode
const isDev = !app.isPackaged;

// -------------------------------------------------------------------------
// ONE-TIME MIGRATION LOGIC
// -------------------------------------------------------------------------
function handleDataMigration(): void {
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
    console.error('[Migration] Non-fatal migration error:', err instanceof Error ? err.message : err);
  }
}

let mainWindow: BrowserWindow | null;
let serverProcess: unknown;
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

console.log = (...args: unknown[]) => {
  const msg =
    `[${new Date().toISOString()}] [LOG] ` +
    args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') +
    '\n';
  logStream.write(msg);
  originalConsoleLog.apply(console, args);
};

console.error = (...args: unknown[]) => {
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
const getFileSize = (filePath: string): number => {
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
    // NOTE: this file compiles to desktop/dist/main.js, one directory deeper
    // than the old desktop/main.js, so the dev-mode path needs an extra ".."
    // to still land on the repo's server/prisma/pos.db.
    const bundledDbPath = isDev
      ? path.join(__dirname, '../../server/prisma/pos.db')
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
// NOTE: this file compiles to desktop/dist/main.js, one directory deeper than
// the old desktop/main.js, so the dev-mode path needs an extra ".." to still
// land on the repo's node_modules/.prisma/client.
const engineDir = isDev
  ? path.join(__dirname, '../../node_modules/.prisma/client')
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

let enginePath: string | null = null;
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

let splashWindow: BrowserWindow | undefined;

const createWindow = (): void => {
  // Use shop_logo.jpeg for app icon
  // NOTE: this file compiles to desktop/dist/main.js, one directory deeper
  // than the old desktop/main.js, so this needs an extra ".." to still land
  // on the repo's assets/ folder.
  const iconPath = path.join(__dirname, '../../assets/shop_logo.jpeg');

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

  // NOTE: splash.html is a static asset that is NOT compiled — it stays at
  // desktop/splash/splash.html (packaged alongside desktop/dist/**, not
  // inside it). This file now lives one directory deeper (desktop/dist/),
  // so the path needs an extra ".." to still reach desktop/splash/splash.html.
  const splashUrl = url.format({
    pathname: path.join(__dirname, '..', 'splash', 'splash.html'),
    protocol: 'file:',
    slashes: true,
  });

  splashWindow.loadURL(splashUrl);

  splashWindow.webContents.on('did-finish-load', () => {
    console.log('Splash screen loaded successfully');
    splashWindow!.webContents.send(IPC.SPLASH_VERSION, app.getVersion());
  });

  splashWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`Splash screen failed to load: ${errorCode} - ${errorDescription}`);
  });

  // 2. Create hidden Main Window
  const windowConfig: Electron.BrowserWindowConstructorOptions = {
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // preload.js is the COMPILED output of preload.ts — Electron cannot
      // load .ts directly. It compiles alongside main.js into the same
      // desktop/dist/ directory, so this same-directory reference is
      // unchanged from the original desktop/main.js.
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
  // NOTE: this file compiles to desktop/dist/main.js, one directory deeper
  // than the old desktop/main.js, so the dev-mode path needs an extra ".."
  // to still land on the repo's client/dist/index.html.
  const startUrl = isDev
    ? 'http://localhost:5173'
    : url.format({
      pathname: path.resolve(__dirname, '../../client/dist/index.html'),
      protocol: 'file:',
      slashes: true,
    });

  // Gate: show main window only when BOTH server is ready AND frontend is loaded.
  // Both start in parallel so total wait = max(server_time, frontend_time) not the sum.
  let serverReady = false;
  let frontendReady = false;

  const tryShowWindow = (): void => {
    if (!serverReady || !frontendReady) return;
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    mainWindow!.show();
    mainWindow!.focus();
  };

  mainWindow.once('ready-to-show', () => {
    frontendReady = true;
    tryShowWindow();
  });

  // 4. Intercept simulated IPC for Splash Screen
  (process as unknown as { send: (msg: { type: string; message: string }) => void }).send = (msg) => {
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

const checkPort = (port: number): Promise<boolean> => {
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

const waitForServer = async (port: number, timeout = 90000): Promise<boolean> => {
  const start = Date.now();
  let attempts = 0;
  while (Date.now() - start < timeout) {
    attempts++;
    const isReady = await checkPort(port);
    if (isReady) {
      console.log(`Server ready on port ${port} after ${Date.now() - start}ms`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  console.error(`Server timed out waiting for port ${port} (${attempts} attempts, ${Date.now() - start}ms)`);
  return false;
};

const startServer = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      process.env.PORT = String(SERVER_PORT);
      process.env.NODE_ENV = isDev ? 'development' : 'production';
      // NOTE: this file compiles to desktop/dist/main.js, one directory
      // deeper than the old desktop/main.js, so the dev-mode path needs an
      // extra ".." to still land on the repo's server/ directory.
      const serverDir = isDev
        ? path.resolve(__dirname, '../../server')
        : path.resolve(process.resourcesPath, 'app.asar.unpacked/server');

      // server-wrapper.js is the COMPILED output of server-wrapper.ts — it
      // compiles alongside main.js into the same desktop/dist/ directory, so
      // this same-directory reference is unchanged from the original
      // desktop/main.js.
      const wrapperPath = path.resolve(__dirname, 'server-wrapper.js');

      // Change to server directory so relative paths work
      process.chdir(serverDir);

      // Add search paths for module resolution
      // NOTE: this file compiles to desktop/dist/main.js, one directory
      // deeper than the old desktop/main.js, so the repo-root node_modules
      // path needs an extra ".." to still resolve correctly.
      module.paths.unshift(path.join(serverDir, 'node_modules'));
      module.paths.unshift(path.join(__dirname, '../../node_modules'));

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

const stopServer = (): void => {
  // Server is running within the Electron process, no need to stop
  console.log('Server will be stopped when app closes');
};

// App metadata moved to top for correct directory resolution

app.on('ready', async () => {
  try {
    // Create Application Menu
    const template: Electron.MenuItemConstructorOptions[] = [
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
            ? [{ type: 'separator' as const }, { role: 'front' as const }, { type: 'separator' as const }, { role: 'window' as const }]
            : [{ role: 'close' as const }]),
        ],
      },
      {
        label: 'Debug',
        submenu: [
          {
            label: 'Wipe App Data (Restart Required)',
            click: async () => {
              const choice = dialog.showMessageBoxSync(mainWindow!, {
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
                      console.error(`Could not delete ${file}:`, e instanceof Error ? e.message : e);
                    }
                  }

                  // 4. Relaunch
                  app.relaunch();
                  app.exit(0);
                } catch (err) {
                  const message = err instanceof Error ? err.message : String(err);
                  dialog.showErrorBox(
                    'Wipe Failed',
                    `A critical error occurred: ${message}\n\nPlease try manually deleting the folder: ${appDataPath}`
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
                    return 'Error reading logs: ' + (e instanceof Error ? e.message : String(e));
                  }
                })()}
              `.trim();
              dialog.showMessageBoxSync(mainWindow!, {
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
      setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 5000);
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
    const message = error instanceof Error ? error.message : String(error);
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
