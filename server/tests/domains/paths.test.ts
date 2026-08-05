import fs from 'fs';
import path from 'path';

import {
  SERVER_ROOT,
  APP_ROOT,
  PRISMA_DIR,
  SCHEMA_PATH_DEV,
  MIGRATIONS_DIR_DEV,
  getSchemaPath,
  getMigrationsDir,
  getPrismaCliPath,
} from '../../src/config/paths';

/**
 * These paths were previously built from `__dirname` in server/index.js, which
 * only worked while the server ran from source. Compiling to server/dist/
 * moves `__dirname` down a level and breaks all of them — and nothing else in
 * the suite would notice, because the failure only appears at boot in a
 * packaged build.
 *
 * This is that missing check.
 */
describe('server path resolution', () => {
  it('locates the server root by finding prisma/schema.prisma', () => {
    expect(fs.existsSync(path.join(SERVER_ROOT, 'package.json'))).toBe(true);
    expect(path.basename(SERVER_ROOT)).toBe('server');
  });

  it('resolves the Prisma schema to a file that exists', () => {
    expect(fs.existsSync(SCHEMA_PATH_DEV)).toBe(true);
    expect(SCHEMA_PATH_DEV).toBe(path.join(SERVER_ROOT, 'prisma', 'schema.prisma'));
  });

  it('resolves the migrations directory to a folder that exists', () => {
    expect(fs.existsSync(MIGRATIONS_DIR_DEV)).toBe(true);
    expect(fs.statSync(MIGRATIONS_DIR_DEV).isDirectory()).toBe(true);
    // A real migration must be present — an empty folder would let the boot
    // sequence believe there is nothing to apply.
    expect(fs.readdirSync(MIGRATIONS_DIR_DEV).length).toBeGreaterThan(0);
  });

  it('places PRISMA_DIR under the server root', () => {
    expect(PRISMA_DIR).toBe(path.join(SERVER_ROOT, 'prisma'));
  });

  it('resolves APP_ROOT one level above the server root', () => {
    expect(APP_ROOT).toBe(path.dirname(SERVER_ROOT));
  });

  describe('Prisma CLI location', () => {
    // Packaged builds resolve the CLI from the application root; development
    // resolves it from server/node_modules. Both branches are preserved from
    // the original runPrismaMigrationsSubprocess logic.
    it('uses the app root when packaged and process.resourcesPath is unavailable (e.g. this test run)', () => {
      expect(getPrismaCliPath(true)).toBe(
        path.join(APP_ROOT, 'node_modules', 'prisma', 'build', 'index.js')
      );
    });

    it('uses server/node_modules in development', () => {
      expect(getPrismaCliPath(false)).toBe(
        path.join(SERVER_ROOT, 'node_modules', 'prisma', 'build', 'index.js')
      );
    });

    it('points at a CLI that exists in this checkout', () => {
      expect(fs.existsSync(getPrismaCliPath(false))).toBe(true);
    });
  });

  describe('packaged path resolution against process.resourcesPath', () => {
    // Regression coverage for a real production bug: getPrismaCliPath/
    // getSchemaPath/getMigrationsDir used to build packaged paths from
    // APP_ROOT/SERVER_ROOT, which — for a module loaded through Electron's
    // packed app.asar — is a *virtual* path like ".../app.asar/server".
    // That resolves fine for in-process reads (Electron's asar-transparent
    // fs patching), but child_process.spawn/exec hands the path straight to
    // the OS, which sees app.asar as a single file, not a directory, and
    // fails with ENOTDIR the moment anything tries to spawn a binary from
    // (or derived from) that path — exactly what happens inside
    // `migrate deploy`, which spawns the schema-engine binary. Reproduced
    // against an actual packaged build, including the already-shipping one,
    // before this fix.
    //
    // These paths must instead be built from process.resourcesPath, which
    // is always a real, physical, on-disk path — mirroring how
    // desktop/main.ts already resolves PRISMA_QUERY_ENGINE_LIBRARY.
    const originalResourcesPath = (process as NodeJS.Process & { resourcesPath?: string })
      .resourcesPath;

    afterEach(() => {
      (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath =
        originalResourcesPath;
    });

    it('resolves the CLI path against process.resourcesPath, not APP_ROOT, when packaged', () => {
      (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath =
        '/Applications/Trovix.app/Contents/Resources';

      const cliPath = getPrismaCliPath(true);

      expect(cliPath).toBe(
        path.join(
          '/Applications/Trovix.app/Contents/Resources',
          'app.asar.unpacked',
          'node_modules',
          'prisma',
          'build',
          'index.js'
        )
      );
      // The specific regression: this must NOT be an app.asar-prefixed
      // (virtual, un-spawnable) path.
      expect(cliPath).not.toContain('app.asar/');
      expect(cliPath).toContain('app.asar.unpacked');
    });

    it('resolves the schema path against process.resourcesPath when packaged', () => {
      (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath =
        '/Applications/Trovix.app/Contents/Resources';

      const schemaPath = getSchemaPath(true);

      expect(schemaPath).toBe(
        path.join(
          '/Applications/Trovix.app/Contents/Resources',
          'app.asar.unpacked',
          'server',
          'prisma',
          'schema.prisma'
        )
      );
      expect(schemaPath).not.toContain('app.asar/');
    });

    it('resolves the migrations directory against process.resourcesPath when packaged', () => {
      (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath =
        '/Applications/Trovix.app/Contents/Resources';

      const migrationsDir = getMigrationsDir(true);

      expect(migrationsDir).toBe(
        path.join(
          '/Applications/Trovix.app/Contents/Resources',
          'app.asar.unpacked',
          'server',
          'prisma',
          'migrations'
        )
      );
      expect(migrationsDir).not.toContain('app.asar/');
    });

    it('still resolves from source when not packaged, even if resourcesPath happens to be set', () => {
      // electron-dev runs the server under Electron without packaging it —
      // process.resourcesPath is set there too, so isPackaged=false must
      // win regardless, or dev would incorrectly hit the packaged branch.
      (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath =
        '/some/electron-dev/Resources';

      expect(getPrismaCliPath(false)).toBe(
        path.join(SERVER_ROOT, 'node_modules', 'prisma', 'build', 'index.js')
      );
      expect(getSchemaPath(false)).toBe(SCHEMA_PATH_DEV);
      expect(getMigrationsDir(false)).toBe(MIGRATIONS_DIR_DEV);
    });
  });
});
