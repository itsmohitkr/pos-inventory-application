// Server wrapper - runs Express server within Electron main process
// This avoids the need for a separate Node.js executable

const path = require('path');
const Module = require('module');

// Get paths - all node_modules are unpacked
const unpackedNodeModules = path.join(__dirname, '..', '..', 'app.asar.unpacked', 'node_modules');
const desktopUnpackedPath = path.join(__dirname, '..', '..', 'app.asar.unpacked', 'desktop');

console.log('Server wrapper starting...');
console.log('Unpacked node_modules:', unpackedNodeModules);
console.log('Server directory:', process.cwd());

// Override module resolution to always use unpacked node_modules for binaries (Prisma)
// and default to ASAR node_modules for regular dependencies (dotenv, express, etc)
const originalResolve = Module._resolveFilename;
const asarNodeModules = path.join(__dirname, '..', 'node_modules');

Module._resolveFilename = function (request, parent, isMain, options) {
  // Skip relative and absolute paths
  if (request.startsWith('.') || path.isAbsolute(request) || /^[a-zA-Z]:\\/.test(request)) {
    return originalResolve(request, parent, isMain, options);
  }

  // 1. Try unpacked node_modules first (essential for Prisma's .node binaries)
  try {
    return require.resolve(request, { paths: [unpackedNodeModules] });
  } catch (e) { }

  // 2. Try root asar node_modules (where most dependencies live)
  try {
    return require.resolve(request, { paths: [asarNodeModules] });
  } catch (e) { }

  // Fall back to default resolution
  return originalResolve(request, parent, isMain, options);
};

// Now load and run the actual server
require(path.join(process.cwd(), 'index.js'));
