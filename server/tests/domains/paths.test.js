const fs = require('fs');
const path = require('path');

const {
  SERVER_ROOT,
  APP_ROOT,
  PRISMA_DIR,
  SCHEMA_PATH,
  MIGRATIONS_DIR,
  getPrismaCliPath,
} = require('../../src/config/paths');

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
    expect(fs.existsSync(SCHEMA_PATH)).toBe(true);
    expect(SCHEMA_PATH).toBe(path.join(SERVER_ROOT, 'prisma', 'schema.prisma'));
  });

  it('resolves the migrations directory to a folder that exists', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
    expect(fs.statSync(MIGRATIONS_DIR).isDirectory()).toBe(true);
    // A real migration must be present — an empty folder would let the boot
    // sequence believe there is nothing to apply.
    expect(fs.readdirSync(MIGRATIONS_DIR).length).toBeGreaterThan(0);
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
    it('uses the app root when packaged', () => {
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
});
