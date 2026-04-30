require('dotenv').config();
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5001;
const BOOT_START = Date.now();
const tlog = (msg) => {
  const elapsed = Date.now() - BOOT_START;
  console.log(`[BOOT +${elapsed}ms] ${msg}`);
};

tlog('server/index.js loaded');

// ── IPC Helper for splash screen ──────────────────────────────────────────────
// process.send is monkey-patched in desktop/main.js to forward to the splash.

const sendSplashMsg = (msg) => {
  if (process.send) process.send({ type: 'splash-status', message: msg });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDbPath() {
  return (process.env.DATABASE_URL || '').replace(/^file:\/\//, '').replace(/^file:/, '');
}

// Path of the migration version cache file, kept next to pos.db in userData.
// Used as a fast-path so repeat boots skip Prisma initialization entirely.
function getMigrationCachePath() {
  const dbPath = getDbPath();
  return dbPath ? path.join(path.dirname(dbPath), '.migration-version') : null;
}

function getLatestMigrationFolder() {
  const dir = path.join(__dirname, 'prisma', 'migrations');
  if (!fs.existsSync(dir)) return null;
  const folders = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  return folders[folders.length - 1] || null;
}

// ── Database backup ───────────────────────────────────────────────────────────
// Runs only when migrations actually need to apply. Uses async I/O so the event
// loop stays free during the copy.

async function backupDatabase(logger) {
  try {
    const dbPath = getDbPath();
    if (!dbPath || !fs.existsSync(dbPath)) return;
    const backupPath = `${dbPath}.bak`;
    await fs.promises.copyFile(dbPath, backupPath);
    logger.info({ backupPath }, '[BOOT] Database backed up before migrations');
  } catch (err) {
    logger.warn({ err: err.message }, '[BOOT] Could not create database backup');
  }
}

// ── Migration check ───────────────────────────────────────────────────────────
//
// Three-tier check, fastest first, so repeat boots cost ~5 ms:
//
//   Tier 1: Cache file fast-path. Read .migration-version, compare to latest
//           folder. Match → migrations are up to date, no work needed. No
//           Prisma client initialised, no subprocess spawned.
//
//   Tier 2: Authoritative DB check. If the cache is missing or doesn't match,
//           query _prisma_migrations directly via the Prisma client. Catches
//           the case where the cache file was deleted or got out of sync.
//
//   Tier 3: Run `prisma migrate deploy` subprocess. Only reached when there
//           are genuinely pending migrations (fresh install or app update with
//           new schema).

async function getAppliedMigrationsFromDb(prisma) {
  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
    `;
    return new Set(rows.map((r) => r.migration_name));
  } catch {
    return null; // table doesn't exist yet (first ever boot)
  }
}

// Returns { skipped: boolean, pending: string[] } — caller runs the subprocess
// only when skipped === false.
async function checkMigrationStatus(prisma, logger) {
  const latest = getLatestMigrationFolder();
  if (!latest) return { skipped: true, pending: [] }; // no migrations folder

  // Tier 1
  const cachePath = getMigrationCachePath();
  if (cachePath && fs.existsSync(cachePath)) {
    try {
      const cached = fs.readFileSync(cachePath, 'utf8').trim();
      if (cached === latest) {
        tlog('Migration cache hit — skipping check');
        return { skipped: true, pending: [] };
      }
    } catch (err) {
      logger.warn({ err: err.message }, '[BOOT] Could not read migration cache');
    }
  }

  // Tier 2
  tlog('Migration cache miss — querying _prisma_migrations');
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  const migrationFolders = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const applied = await getAppliedMigrationsFromDb(prisma);
  const pending =
    applied === null ? migrationFolders : migrationFolders.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    // Schema is up to date even though the cache wasn't. Update cache.
    if (cachePath) {
      try {
        fs.writeFileSync(cachePath, latest);
      } catch (err) {
        logger.warn({ err: err.message }, '[BOOT] Could not write migration cache');
      }
    }
    return { skipped: true, pending: [] };
  }

  return { skipped: false, pending };
}

async function runPrismaMigrationsSubprocess(logger) {
  const util = require('util');
  const execAsync = util.promisify(require('child_process').exec);

  let prismaCliPath;
  let schemaPath;
  const pEnv = { ...process.env };
  const nodeExecutable = process.execPath;

  const isPackaged = process.env.NODE_ENV === 'production' || __dirname.includes('app.asar');

  if (isPackaged) {
    prismaCliPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
    schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    pEnv.ELECTRON_RUN_AS_NODE = '1';
  } else {
    prismaCliPath = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
    schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  }

  try {
    await execAsync(
      `"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`,
      { env: pEnv, encoding: 'utf-8' }
    );
    logger.info('[BOOT MIGRATION] migrate deploy succeeded');
  } catch (deployError) {
    const errorMsg = deployError.stderr || deployError.stdout || deployError.message || '';
    if (!errorMsg.includes('P3005')) throw deployError;

    // P3005: schema is non-empty but _prisma_migrations is missing. Baseline
    // every existing migration as already applied, then re-run deploy.
    logger.warn('[BOOT MIGRATION] P3005 — baselining existing schema');

    const migrationsDir = path.join(path.dirname(schemaPath), 'migrations');
    if (!fs.existsSync(migrationsDir)) throw deployError;

    const dirs = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const migration of dirs) {
      try {
        await execAsync(
          `"${nodeExecutable}" "${prismaCliPath}" migrate resolve --applied "${migration}" --schema="${schemaPath}"`,
          { env: pEnv }
        );
      } catch {
        // Already resolved — fine
      }
    }

    await execAsync(
      `"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`,
      { env: pEnv, encoding: 'utf-8' }
    );
    logger.info('[BOOT MIGRATION] post-baseline deploy succeeded');
  }
}

async function ensureMigrationsApplied(prisma, logger) {
  tlog('Checking migration status...');
  const { skipped, pending } = await checkMigrationStatus(prisma, logger);

  if (skipped) {
    tlog('Migrations already applied');
    return;
  }

  logger.info({ pendingCount: pending.length }, '[BOOT MIGRATION] Running deploy');
  sendSplashMsg('Applying database schemas...');
  await backupDatabase(logger);
  await runPrismaMigrationsSubprocess(logger);

  // Update cache so the next boot hits the fast path
  const cachePath = getMigrationCachePath();
  const latest = getLatestMigrationFolder();
  if (cachePath && latest) {
    try {
      fs.writeFileSync(cachePath, latest);
    } catch (err) {
      logger.warn({ err: err.message }, '[BOOT] Could not write migration cache');
    }
  }
  tlog('Migrations applied');
}

// ── Password migration ────────────────────────────────────────────────────────
// Bcrypt-hashes any users still stored with plaintext passwords. Non-critical,
// so it runs after the server is listening — it doesn't block the UI.

async function migratePasswordsToHash(prisma, logger) {
  try {
    const bcrypt = require('bcryptjs');
    const users = await prisma.user.findMany({ select: { id: true, password: true } });
    const plaintext = users.filter((u) => u.password && !u.password.startsWith('$2'));
    if (plaintext.length === 0) return;

    logger.info(`[BOOT] Migrating ${plaintext.length} plaintext password(s) to bcrypt...`);
    for (const user of plaintext) {
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    }
    logger.info('[BOOT] Password migration complete.');
  } catch (err) {
    logger.warn({ err: err.message }, '[BOOT] Password migration failed (non-fatal)');
  }
}

// ── Seeding ───────────────────────────────────────────────────────────────────
// Migrations must already be applied before this runs.

async function seedDefaults(prisma, logger) {
  const settingService = require('./src/domains/setting/setting.service');
  const { DEFAULT_RECEIPT_SETTINGS, DEFAULT_SHOP_METADATA } = require('./src/config/constants');

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const { seedEssential } = require('./seed');
    await seedEssential();
    logger.info('Database initialized with default users');
  }

  // One read for all keys, then parallel writes for any missing.
  const neededKeys = [
    'posShopName',
    'posReceiptSettings',
    'posPaymentSettings',
    ...Object.keys(DEFAULT_SHOP_METADATA),
  ];
  const existing = await prisma.setting.findMany({
    where: { key: { in: neededKeys } },
    select: { key: true },
  });
  const has = new Set(existing.map((s) => s.key));

  const writes = [];
  if (!has.has('posShopName'))
    writes.push(settingService.updateSetting('posShopName', 'My Shop'));
  if (!has.has('posReceiptSettings'))
    writes.push(settingService.updateSetting('posReceiptSettings', DEFAULT_RECEIPT_SETTINGS));
  if (!has.has('posPaymentSettings'))
    writes.push(
      settingService.updateSetting('posPaymentSettings', {
        enabledMethods: ['cash'],
        allowMultplePayment: false,
        customMethods: [],
      })
    );
  for (const [key, defaultValue] of Object.entries(DEFAULT_SHOP_METADATA)) {
    if (!has.has(key)) writes.push(settingService.updateSetting(key, defaultValue));
  }
  if (writes.length) await Promise.all(writes);
}

// ── Server bootstrap ──────────────────────────────────────────────────────────
//
// Strict sequential order. The port only opens once the database is fully
// migrated and seeded — this is the only way to guarantee no API request
// ever hits a half-initialised schema.

async function main() {
  // Fail fast at the top level: any unhandled error here is logged with full
  // detail. Caller (server-wrapper.js → desktop/main.js) shows a dialog.
  try {
    tlog('Loading prisma client...');
    const prisma = require('./src/config/prisma');
    tlog('Prisma client loaded');

    const logger = require('./src/shared/utils/logger');

    sendSplashMsg('Checking database...');
    await ensureMigrationsApplied(prisma, logger);

    sendSplashMsg('Loading data...');
    await seedDefaults(prisma, logger);
    tlog('Seeding done');

    tlog('Loading express app...');
    const app = require('./src/app');
    tlog('Express app loaded');

    app.on('error', (err) => {
      logger.error({ err: err.message, code: err.code }, '[BOOT FATAL] Server error');
      if (err.code === 'EADDRINUSE') {
        logger.error(`[BOOT FATAL] Port ${PORT} already in use`);
      }
      process.exit(1);
    });

    await new Promise((resolve, reject) => {
      const server = app.listen(PORT, '127.0.0.1', () => {
        tlog(`Server listening on port ${PORT}`);
        sendSplashMsg('Starting UI...');
        resolve();
      });
      server.once('error', reject);
    });

    // ── Non-critical post-listen tasks ──
    // These don't block the UI — the user can already use the app.

    setImmediate(() => {
      migratePasswordsToHash(prisma, logger).catch(() => {});
    });

    // Delay WhatsApp auto-reconnect so Puppeteer/Chromium doesn't compete
    // with app loading. 15 s is enough for the user to start interacting.
    setTimeout(async () => {
      try {
        const whatsappService = require('./src/domains/whatsapp/whatsapp.service');
        const isWaEnabled = await whatsappService.isEnabled();
        if (isWaEnabled) {
          logger.info('[BOOT] WhatsApp enabled — auto-reconnecting session...');
          whatsappService.initializeClient();
        }
      } catch (waErr) {
        logger.warn({ err: waErr.message }, '[BOOT] Failed to auto-init WhatsApp');
      }
    }, 15_000);
  } catch (err) {
    console.error('[BOOT FATAL]', err);
    // Re-throw so server-wrapper / Electron main shows the error dialog
    throw err;
  }
}

main().catch((err) => {
  console.error('SERVER BOOT FATAL:', err);
  process.exitCode = 1;
});

// Keep process alive (Electron main process owns lifecycle)
setInterval(() => {}, 10000);
