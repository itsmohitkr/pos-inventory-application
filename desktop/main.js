const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Check if running in development mode
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;
const SERVER_PORT = 5001;

// Get app data path for SQLite database storage
const getAppDataPath = () => {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'BachatBazaar');
  } else if (process.platform === 'win32') {
    return path.join(process.env.APPDATA, 'BachatBazaar');
  }
  return path.join(os.homedir(), '.BachatBazaar');
};

// Ensure app data directory exists
const appDataPath = getAppDataPath();
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

// Set environment variable for Prisma DB path
process.env.DATABASE_URL = `file:${path.join(appDataPath, 'pos.db')}`;

const createWindow = () => {
  const iconPath = path.join(__dirname, '../assets/icon.png');
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
  
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../client/dist/index.html')}`;

  mainWindow.loadURL(startUrl);
  
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

      const serverDir = isDev
        ? path.join(__dirname, '../server')
        : path.join(process.resourcesPath, 'app.asar.unpacked/server');

      const wrapperPath = isDev
        ? path.join(__dirname, 'server-wrapper.js')
        : path.join(__dirname, 'server-wrapper.js');

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
        
        // Wait a bit for server to start
        setTimeout(() => {
          resolve();
        }, 2000);
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

// Set app name
app.setName('Bachat Bazaar');
app.setAppUserModelId('com.bachatbazaar.pos');

app.on('ready', async () => {
  try {
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

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => appDataPath);
