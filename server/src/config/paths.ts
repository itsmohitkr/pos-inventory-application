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
export const SCHEMA_PATH = path.join(PRISMA_DIR, 'schema.prisma');
export const MIGRATIONS_DIR = path.join(PRISMA_DIR, 'migrations');

/**
 * Location of the Prisma CLI entry point.
 *
 * Packaged builds resolve it from the application root; development resolves
 * it from server/node_modules. This mirrors the existing branch in
 * runPrismaMigrationsSubprocess and is kept as a function so the caller
 * decides, exactly as before.
 */
export const getPrismaCliPath = (isPackaged: boolean): string =>
  path.join(
    isPackaged ? APP_ROOT : SERVER_ROOT,
    'node_modules',
    'prisma',
    'build',
    'index.js'
  );

