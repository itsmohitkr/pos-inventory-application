// Server wrapper - runs Express server within Electron main process
// This avoids the need for a separate Node.js executable

import path = require('path');
import Module = require('module');

// Only Prisma's own packages (CLI, client, native engine) are unpacked —
// see package.json's asarUnpack. Everything else (Express, Joi, pino,
// helmet, bcryptjs, ...) now stays packed inside app.asar, resolved via
// Electron's normal asar-transparent fs, same as any other in-process file.
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

// Override module resolution — but as a FALLBACK now, not the primary path.
// _resolveFilename is an internal, untyped Node API — cast through `any` the
// same way the original .js code accessed it dynamically.
//
// HISTORY — read this before changing the try-order below.
// This override originally forced EVERY bare-specifier require through the
// unpacked node_modules tree first, because at the time everything was
// unpacked there. package.json's asarUnpack now only unpacks Prisma's own
// packages (CLI, client, native engine) — everything else stays packed
// inside app.asar, which Electron's own fs patching already resolves
// transparently, the same as any other in-process file read. So normal
// resolution is tried FIRST here, falling back to the (now much smaller)
// unpacked tree only for what's genuinely still there — the fallback is
// deliberately kept, not deleted, as a safety net for whatever originally
// motivated it (most likely a hoisting/lookup edge case that made a plain
// require() fail from inside an asar-packed script for some package).
//
// A prior attempt at exactly this reordering (commit 35d6050) was later
// undone by a broad "clean revert" (commit d2d7334) alongside a chain of
// other Windows packaging/resource-loading fixes — it isn't fully knowable
// from history alone whether THIS specific piece was the cause or
// collateral rollback alongside an unrelated main.js problem. This change
// is scoped narrower than that attempt (asarUnpack now excludes only
// non-Prisma packages, not everything), but it must still be verified on an
// actual Windows packaged build — see the startup-perf plan's verification
// section — not merged on macOS/dev testing alone.
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

  // 1. Try normal resolution first — correct for everything still packed
  //    inside app.asar (the vast majority of packages now).
  try {
    const result = originalResolve(request, parent, isMain, options);
    resolutionCache.set(cacheKey, result);
    return result;
  } catch (e) {
    // Fall through to the unpacked tree below.
  }

  // 2. Fall back to the unpacked tree — Prisma's own packages, and a safety
  //    net for anything normal resolution genuinely can't find.
  const unpackedPath = require.resolve(request, { paths: [unpackedNodeModules] });
  resolutionCache.set(cacheKey, unpackedPath);
  return unpackedPath;
};

// Now load and run the actual server
// The server is TypeScript and ships compiled. process.cwd() is set to the
// server directory by main.js — specifically to the *unpacked* server
// directory (see main.ts's `serverDir`), not a virtual app.asar path — so
// this resolves to a real, physical server/dist/index.js.
//
// This is an ABSOLUTE path (path.join on process.cwd()), so the
// resolveFilename override above never touches it — that override only
// intercepts bare specifiers. That means server/dist/**/* MUST stay in
// package.json's asarUnpack list, even though it holds no native binaries
// and nothing here spawns it as a subprocess: it's genuinely the odd one
// out, unpacked not because it needs to be for the reasons everything else
// in asarUnpack does, but because this require() has no fallback path to
// find it packed. Removing it breaks every boot with
// "Cannot find module '.../app.asar.unpacked/server/dist/index.js'" —
// caught by smoke-mac in CI on the first real release attempt after the
// asarUnpack narrowing that dropped it, before it ever reached a customer.
require(path.join(process.cwd(), 'dist', 'index.js'));
