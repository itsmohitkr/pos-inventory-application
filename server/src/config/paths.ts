import fs from 'fs';
import path from 'path';

/**
 * Single source of truth for filesystem locations the server needs at runtime.
 *
 * WHY THIS EXISTS
 * ---------------
 * These paths used to be built from `__dirname` inside server/index.js, which
 * worked only because the server ran from source (server/index.js, so
 * `__dirname` was server/). Once the server compiles to server/dist/,
 * `__dirname` moves down a level and every one of those lookups silently
 * points at a directory that does not exist — the migrations folder, the
 * Prisma schema, and the Prisma CLI.
 *
 * Nothing in the test suite covers those lookups; they fail only in a packaged
 * build on a customer machine, at boot, with the app refusing to open.
 *
 * HOW IT RESOLVES
 * ---------------
 * Rather than hardcoding a number of levels to climb (which breaks again if
 * the output layout changes), SERVER_ROOT is found by walking up from this
 * file until a directory containing prisma/schema.prisma appears. That holds
 * whether this module sits at:
 *
 *   server/src/config/paths.js        (dev, running from source)
 *   server/dist/src/config/paths.js   (compiled, rootDir ".")
 *   server/dist/config/paths.js       (compiled, rootDir "src")
 */

const MAX_LEVELS = 6;

const findServerRoot = (startDir: string): string => {
  let dir = startDir;

  for (let i = 0; i < MAX_LEVELS; i += 1) {
    if (fs.existsSync(path.join(dir, 'prisma', 'schema.prisma'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // reached the filesystem root
    dir = parent;
  }

  // Fall back to the historical layout (this file two levels below server/)
  // rather than throwing during module load.
  return path.resolve(startDir, '..', '..');
};

/** The `server/` directory — holds prisma/, package.json and node_modules. */
export const SERVER_ROOT = findServerRoot(__dirname);

/** The application root, one level above server/. */
export const APP_ROOT = path.resolve(SERVER_ROOT, '..');

export const PRISMA_DIR = path.join(SERVER_ROOT, 'prisma');
export const SCHEMA_PATH_DEV = path.join(PRISMA_DIR, 'schema.prisma');
export const MIGRATIONS_DIR_DEV = path.join(PRISMA_DIR, 'migrations');

/**
 * Real, physical, on-disk resources directory for a packaged Electron app
 * (e.g. `.../Trovix.app/Contents/Resources` on macOS). Undefined outside
 * Electron (plain `npm run dev`) or in dev-mode Electron (`electron-dev`),
 * neither of which reach the packaged branches below.
 *
 * Not typed by @types/node — `electron` isn't a server dependency (the
 * server is designed to run standalone) — so this is the one place that
 * knows about it, via a narrow cast rather than `any`.
 */
const getResourcesPath = (): string | undefined =>
  (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;

/**
 * Real, physical path to whatever `asarUnpack` has unpacked, for a packaged
 * build. Every path a subprocess will need to spawn (the Prisma CLI, and by
 * extension the schema-engine binary it locates relative to its own
 * __dirname) MUST be built from this, never from SERVER_ROOT/APP_ROOT.
 *
 * SERVER_ROOT/APP_ROOT are found by walking up from this module's own
 * __dirname — which, for a module loaded through Electron's packed
 * app.asar, is a *virtual* path like ".../app.asar/server". Electron's
 * asar-transparent fs patching makes that virtual path work fine for
 * in-process reads (fs.existsSync, require, reading source to run as a
 * subprocess's main script) — but child_process.spawn/exec hands the path
 * straight to the OS's execve(), which has no concept of asar and sees
 * app.asar as a single file, not a directory. Any spawn target built from
 * that virtual path — or, critically, anything Prisma's own CLI derives
 * *from* its own __dirname once loaded from that virtual path, like the
 * schema-engine binary — fails with ENOTDIR. This is why `migrate deploy`
 * failed 100% of the time in a packaged build, confirmed by reproducing the
 * exact failure against the already-shipping build too, not just this
 * change. desktop/main.ts already avoids this same trap for
 * PRISMA_QUERY_ENGINE_LIBRARY by resolving from process.resourcesPath; this
 * mirrors that pattern for the schema/CLI paths handed to a subprocess.
 */
const unpackedRoot = (): string => {
  const resourcesPath = getResourcesPath();
  if (!resourcesPath) {
    // Not running under a packaged Electron process — callers only reach
    // here when isPackaged is true, which should never happen in that case.
    // Falling back to SERVER_ROOT/APP_ROOT rather than throwing keeps this
    // a soft failure (surfaced as a normal ENOENT downstream) instead of a
    // crash in a path-resolution helper.
    return APP_ROOT;
  }
  return path.join(resourcesPath, 'app.asar.unpacked');
};

/**
 * Prisma schema path. Packaged builds resolve it against the real unpacked
 * directory (see unpackedRoot) since it's passed as a `--schema=` argument
 * to a spawned subprocess; development resolves it from server/prisma
 * (running from source, no asar boundary to cross).
 */
export const getSchemaPath = (isPackaged: boolean): string =>
  isPackaged
    ? path.join(unpackedRoot(), 'server', 'prisma', 'schema.prisma')
    : SCHEMA_PATH_DEV;

/**
 * Prisma migrations directory. Only ever read in-process (fs.existsSync /
 * fs.readdirSync), so the virtual asar path would actually have worked here
 * — resolved the same way as getSchemaPath anyway, for consistency and to
 * avoid a second, differently-behaved path-resolution rule to remember.
 */
export const getMigrationsDir = (isPackaged: boolean): string =>
  isPackaged
    ? path.join(unpackedRoot(), 'server', 'prisma', 'migrations')
    : MIGRATIONS_DIR_DEV;

/**
 * Location of the Prisma CLI entry point. Packaged builds resolve it from
 * the real unpacked directory (see unpackedRoot) since it's spawned as a
 * subprocess; development resolves it from server/node_modules.
 */
export const getPrismaCliPath = (isPackaged: boolean): string =>
  isPackaged
    ? path.join(unpackedRoot(), 'node_modules', 'prisma', 'build', 'index.js')
    : path.join(SERVER_ROOT, 'node_modules', 'prisma', 'build', 'index.js');

