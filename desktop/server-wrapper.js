// Server wrapper - runs Express server within Electron main process
// This avoids the need for a separate Node.js executable

const path = require('path');
const Module = require('module');
const { app } = require('electron');

// Get paths for both unpacked and bundled node_modules
const rootPath = app.getAppPath();
const asarNodeModules = path.join(rootPath, 'node_modules');
const unpackedNodeModules = path.join(rootPath, '..', 'app.asar.unpacked', 'node_modules');

console.log('Server wrapper starting...');
console.log('ASAR node_modules:', asarNodeModules);
console.log('Unpacked node_modules:', unpackedNodeModules);
console.log('Server directory:', process.cwd());

// Override module resolution to search both ASAR and unpacked directories
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  // Try default resolution first
  try {
    return originalResolve(request, parent, isMain, options);
  } catch (e) {
    // If it fails (common when server is unpacked but deps are in ASAR), try specific paths

    // 1. Try root asar node_modules (where dotenv, express etc likely are)
    try {
      return require.resolve(request, { paths: [asarNodeModules] });
    } catch (err) { }

    // 2. Try unpacked node_modules (where Prisma engine is)
    try {
      return require.resolve(request, { paths: [unpackedNodeModules] });
    } catch (err) { }

    // If all fail, throw original error
    throw e;
  }
};

// Set DATABASE_URL to a writable location in production (userData)
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'pos.db');
const formattedDbPath = dbPath.replace(/\\/g, '/');
process.env.DATABASE_URL = process.platform === 'win32'
  ? `file:${formattedDbPath}`
  : `file://${formattedDbPath}`;

console.log('DATABASE_URL set to:', process.env.DATABASE_URL);

// Now load and run the actual server
require(path.join(process.cwd(), 'index.js'));
