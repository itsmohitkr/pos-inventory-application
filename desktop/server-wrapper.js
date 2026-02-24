// Server wrapper - runs Express server within Electron main process
// This avoids the need for a separate Node.js executable

const path = require('path');
const Module = require('module');

// Get paths - all node_modules are unpacked
const unpackedNodeModules = path.join(__dirname, '..', '..', 'app.asar.unpacked', 'node_modules');
const desktopUnpackedPath = path.join(__dirname, '..', '..', 'app.asar.unpacked', 'desktop');

console.log('Server wrapper starting...');
console.log('Unpacked node_modules:', unpackedNodeModules);

// --- CONTROLLED MODULE RESOLUTION ---
const asarNodeModules = path.join(__dirname, '..', 'node_modules');

// Override module resolution ONLY for the server process
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  // Try standard resolution first
  try {
    return originalResolve(request, parent, isMain, options);
  } catch (e) {
    // 1. Try root asar node_modules (Standard dependencies)
    try {
      return require.resolve(request, { paths: [asarNodeModules] });
    } catch (err) { }

    // 2. Try unpacked node_modules (Prisma binaries)
    try {
      return require.resolve(request, { paths: [unpackedNodeModules] });
    } catch (err) { }

    throw e;
  }
};
console.log('Server directory:', process.cwd());

// Load and run the actual server
require(path.join(process.cwd(), 'index.js'));
