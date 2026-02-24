const path = require('path');
const Module = require('module');
const { app } = require('electron');

console.log('Server wrapper starting...');
console.log('Server directory:', process.cwd());

// --- TARGETED MODULE RESOLUTION ---
const rootPath = app.getAppPath();
const asarNodeModules = path.join(rootPath, 'node_modules');
const unpackedNodeModules = path.join(rootPath, '..', 'app.asar.unpacked', 'node_modules');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return originalResolve(request, parent, isMain, options);
  } catch (e) {
    // 1. Try root asar node_modules
    try {
      return require.resolve(request, { paths: [asarNodeModules] });
    } catch (err) { }

    // 2. Try unpacked node_modules
    try {
      return require.resolve(request, { paths: [unpackedNodeModules] });
    } catch (err) { }

    throw e;
  }
};

// Load and run the actual server
const serverIndex = path.join(process.cwd(), 'index.js');
console.log(`Requiring server index: ${serverIndex}`);
require(serverIndex);
