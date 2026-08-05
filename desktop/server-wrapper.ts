// Server wrapper - runs Express server within Electron main process
// This avoids the need for a separate Node.js executable

import path = require('path');
import Module = require('module');

// Get paths - all node_modules are unpacked
// NOTE: this file compiles to desktop/dist/server-wrapper.js, one directory
// deeper than the old desktop/server-wrapper.js. Packaged layout is
// app.asar/desktop/dist/server-wrapper.js, so reaching the real Resources
// folder that contains app.asar.unpacked now takes three ".." pops
// (dist -> desktop -> app.asar -> Resources), not two.
const unpackedNodeModules = path.join(__dirname, '..', '..', '..', 'app.asar.unpacked', 'node_modules');
const desktopUnpackedPath = path.join(__dirname, '..', '..', '..', 'app.asar.unpacked', 'desktop');
// desktopUnpackedPath is computed but unused, same as in the original .js file.
void desktopUnpackedPath;

console.log('Server wrapper starting...');
console.log('Unpacked node_modules:', unpackedNodeModules);
console.log('Server directory:', process.cwd());

// Override module resolution to always use unpacked node_modules
// _resolveFilename is an internal, untyped Node API — cast through `any` the
// same way the original .js code accessed it dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ModuleInternal = Module as any;
const originalResolve = ModuleInternal._resolveFilename;
const resolutionCache = new Map<string, string>();

ModuleInternal._resolveFilename = function (
  request: string,
  parent: { id: string } | null | undefined,
  isMain: boolean,
  options: unknown
) {
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
// The server is TypeScript and ships compiled. process.cwd() is set to the
// server directory by main.js, so this resolves to server/dist/index.js.
require(path.join(process.cwd(), 'dist', 'index.js'));
