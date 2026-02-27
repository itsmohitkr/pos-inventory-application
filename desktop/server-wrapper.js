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

// Override module resolution to always use unpacked node_modules
const originalResolve = Module._resolveFilename;
const resolutionCache = new Map();

Module._resolveFilename = function (request, parent, isMain, options) {
  // Skip relative and absolute paths (handles both / and C:\ styles)
  if (request.startsWith('.') || path.isAbsolute(request) || /^[a-zA-Z]:\\/.test(request)) {
    return originalResolve(request, parent, isMain, options);
  }

  const cacheKey = request + '|' + (parent ? parent.id : '');
  if (resolutionCache.has(cacheKey)) {
    return resolutionCache.get(cacheKey);
  }

  // Try unpacked node_modules for all module requests
  try {
    const unpackedPath = require.resolve(request, { paths: [unpackedNodeModules] });
    resolutionCache.set(cacheKey, unpackedPath);
    return unpackedPath;
  } catch (e) {
    // Fall back to default resolution
  }

  const result = originalResolve(request, parent, isMain, options);
  resolutionCache.set(cacheKey, result);
  return result;
};

// Now load and run the actual server
require(path.join(process.cwd(), 'index.js'));
