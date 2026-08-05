// Resolves a path to a compiled server/dist/** module for require()'ing from
// desktop/ipc/*.ts handlers.
//
// Deliberately self-contained within desktop/'s own compiled output tree
// (desktop/dist/ipc/resolveServerModule.js) rather than importing
// server/src/config/paths.ts's equivalent logic — importing a server file
// from here would itself need a relative require() reaching across from
// desktop/dist/ipc/** (packed) into server/dist/** (unpacked), which is
// exactly the fragile, hand-computed cross-directory relative path this
// function exists to avoid for every *other* server module. Keeping the
// path math for THIS one file entirely within desktop/'s own tree makes it
// self-verifiable: __dirname here is always desktop/dist/ipc, a fixed,
// known location, not something that shifts per target module.
//
// Packaged builds resolve via process.resourcesPath, mirroring
// server/src/config/paths.ts's getSchemaPath/getPrismaCliPath — the same
// tested pattern, not a new one. See the IPC migration plan for the
// packed/unpacked boundary background (the same class of bug broke v217-v219
// three times before that pattern was established).
import { app } from 'electron';
import path = require('path');

export const resolveServerModulePath = (...segments: string[]): string => {
  if (app.isPackaged) {
    const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
    if (!resourcesPath) {
      throw new Error('resolveServerModulePath: process.resourcesPath is unavailable while packaged.');
    }
    return path.join(resourcesPath, 'app.asar.unpacked', 'server', 'dist', ...segments);
  }

  // Dev / electron-dev: this file compiles to desktop/dist/ipc/, so
  // server/dist/ sits three levels up (ipc -> dist -> desktop -> repo root),
  // then into server/dist/**. Mirrors the "three pops" comment pattern in
  // desktop/server-wrapper.ts for the same reason (this file is one
  // directory deeper than desktop/main.ts).
  return path.join(__dirname, '..', '..', '..', 'server', 'dist', ...segments);
};
