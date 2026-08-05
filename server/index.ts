require('dotenv').config();
const Sentry = require("@sentry/node");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "production",
  });
}

import path = require('path');
import fs = require('fs');
import type { NextFunction, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import {
  SERVER_ROOT,
  getSchemaPath,
  getMigrationsDir,
  getPrismaCliPath,
} from './src/config/paths';
import { getErrorMessage } from './src/shared/utils/errorMessage';

// Computed once, reused everywhere a path needs to know whether it's
// resolving against a packaged app.asar or running from source. Must match
// exactly how paths.ts's getSchemaPath/getMigrationsDir/getPrismaCliPath
// expect to be called — see that module for why the distinction matters
// (a subprocess spawn needs the real unpacked path, not a virtual asar one).
const IS_PACKAGED =
  process.env.NODE_ENV === 'production' || SERVER_ROOT.includes('app.asar');

const PORT = process.env.PORT || 5001;
const BOOT_START = Date.now();
const tlog = (msg: string) => {
  const elapsed = Date.now() - BOOT_START;
  console.log(`[BOOT +${elapsed}ms] ${msg}`);
};

tlog('server/index.js loaded');

// ── IPC Helper for splash screen ──────────────────────────────────────────────
// process.send is monkey-patched in desktop/main.js to forward to the splash.

// `done: true` marks the two points where the background bootstrap settles
// (success or failure) — desktop/main.ts uses this, not raw port-open, to
// decide when it's safe to close the splash screen. Without it the main
// window can appear before migrations/seeding/route-loading finish, and the
// very first data fetch then sits blocked in gatingMiddleware for up to 30s
// — which reads to a user as "the app is frozen," even though the splash
// screen showing real progress was still available and closed too early.
const sendSplashMsg = (msg: string, done = false) => {
  if (process.send) process.send({ type: 'splash-status', message: msg, done });
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
  const dir = getMigrationsDir(IS_PACKAGED);
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

async function backupDatabase(logger: Logger) {
  try {
    const dbPath = getDbPath();
    if (!dbPath || !fs.existsSync(dbPath)) return;
    const backupPath = `${dbPath}.bak`;
    await fs.promises.copyFile(dbPath, backupPath);
    logger.info({ backupPath }, '[BOOT] Database backed up before migrations');
  } catch (err) {
    logger.warn({ err: getErrorMessage(err) }, '[BOOT] Could not create database backup');
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

async function getAppliedMigrationsFromDb(prisma: PrismaClient) {
  try {
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
    `;
    return new Set(rows.map((r) => r.migration_name));
  } catch {
    return null; // table doesn't exist yet (first ever boot)
  }
}

// Returns { skipped: boolean, pending: string[] } — caller runs the subprocess
// only when skipped === false.
async function checkMigrationStatus(prisma: PrismaClient, logger: Logger) {
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
      logger.warn({ err: getErrorMessage(err) }, '[BOOT] Could not read migration cache');
    }
  }

  // Tier 2
  tlog('Migration cache miss — querying _prisma_migrations');
  const migrationsDir = getMigrationsDir(IS_PACKAGED);
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
        logger.warn({ err: getErrorMessage(err) }, '[BOOT] Could not write migration cache');
      }
    }
    return { skipped: true, pending: [] };
  }

  return { skipped: false, pending };
}

async function runPrismaMigrationsSubprocess(logger: Logger) {
  const util = require('util');
  const execAsync = util.promisify(require('child_process').exec);

  const pEnv = { ...process.env };
  const nodeExecutable = process.execPath;

  const prismaCliPath = getPrismaCliPath(IS_PACKAGED);
  const schemaPath = getSchemaPath(IS_PACKAGED);
  if (IS_PACKAGED) {
    pEnv.ELECTRON_RUN_AS_NODE = '1';
  }

  try {
    await execAsync(
      `"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`,
      { env: pEnv, encoding: 'utf-8' }
    );
    logger.info('[BOOT MIGRATION] migrate deploy succeeded');
  } catch (deployError) {
    const execErr = deployError as { stderr?: string; stdout?: string; message?: string };
    const errorMsg = execErr.stderr || execErr.stdout || execErr.message || '';
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

async function ensureMigrationsApplied(prisma: PrismaClient, logger: Logger) {
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
      logger.warn({ err: getErrorMessage(err) }, '[BOOT] Could not write migration cache');
    }
  }
  tlog('Migrations applied');
}

// ── Barcode cleanup on soft-deleted products ──────────────────────────────────
// One-time data fix: nulls out barcode on any product already soft-deleted
// so the DB-level @unique constraint doesn't block reuse of those barcodes.
// Safe because historical sales join by productId, never by barcode.

async function clearBarcodesOnDeletedProducts(prisma: PrismaClient, logger: Logger) {
  try {
    const updated = await prisma.product.updateMany({
      where: { isDeleted: true, barcode: { not: null } },
      data: { barcode: null },
    });
    if (updated.count > 0) {
      logger.info(`[BOOT] Cleared barcodes on ${updated.count} soft-deleted product(s)`);
    }
  } catch (err) {
    logger.warn({ err: getErrorMessage(err) }, '[BOOT] clearBarcodesOnDeletedProducts failed (non-fatal)');
  }
}

// ── Password migration ────────────────────────────────────────────────────────
// Bcrypt-hashes any users still stored with plaintext passwords. Non-critical,
// so it runs after the server is listening — it doesn't block the UI.

async function migratePasswordsToHash(prisma: PrismaClient, logger: Logger) {
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
    logger.warn({ err: getErrorMessage(err) }, '[BOOT] Password migration failed (non-fatal)');
  }
}

// ── Seeding ───────────────────────────────────────────────────────────────────
// Migrations must already be applied before this runs.

async function seedDefaults(prisma: PrismaClient, logger: Logger) {
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

  const writes: Promise<unknown>[] = [];
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

let isSystemReady = false;
let systemError: Error | null = null;

/**
 * Gating middleware that holds requests until the system is ready.
 * If the system is ready, it passes through to the next middleware (the real app).
 * If booting, it waits. If it failed, it returns 503.
 */
function gatingMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isSystemReady) {
    return next();
  }
  if (systemError) {
    return res.status(503).json({
      error: 'System failed to initialize',
      details: systemError.message,
    });
  }

  // If not ready, we could either return 503 or wait.
  // Waiting is better for UX as it avoids a 'retry' loop in the frontend.
  // Both timers are cleared on every exit path — otherwise each request that
  // arrives during boot leaves a 30s timer pinned to a closed response.
  const cleanup = () => {
    clearInterval(checkReady);
    clearTimeout(bootTimeout);
  };

  const checkReady = setInterval(() => {
    if (isSystemReady) {
      cleanup();
      next();
    } else if (systemError) {
      cleanup();
      res.status(503).json({
        error: 'System failed to initialize during boot',
        details: systemError.message,
      });
    }
  }, 500);

  // Safety timeout for the request itself (30s)
  const bootTimeout = setTimeout(() => {
    cleanup();
    if (!isSystemReady && !res.headersSent) {
      res.status(503).json({ error: 'System boot timeout' });
    }
  }, 30000);

  // If the client disconnects while waiting, stop polling on its behalf.
  res.on('close', cleanup);
}

async function main() {
  const express = require('express');
  const bootApp = express();

  // 1. Start listening IMMEDIATELY to satisfy Electron's port check
  const server = bootApp.listen(PORT, '127.0.0.1', () => {
    tlog(`Server listening on port ${PORT} (Parallel Boot)`);
    sendSplashMsg('Server engine started...');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    console.error('[BOOT FATAL] Server failed to bind port:', err);
    process.exit(1);
  });

  // 2. Background Bootstrap
  // We don't 'await' this so the main thread continues
  (async () => {
    try {
      tlog('Background bootstrap started');
      
      tlog('Loading prisma client...');
      const prisma = require('./src/config/prisma');
      tlog('Prisma client loaded');

      const logger = require('./src/shared/utils/logger');

      sendSplashMsg('Checking database schema...');
      await ensureMigrationsApplied(prisma, logger);

      sendSplashMsg('Syncing database defaults...');
      await seedDefaults(prisma, logger);
      await clearBarcodesOnDeletedProducts(prisma, logger);
      tlog('Database bootstrap done');

      tlog('Loading core application...');
      const realApp = require('./src/app');
      
      // Inject gating and then mount the real app
      bootApp.use(gatingMiddleware);
      bootApp.use(realApp);
      
      isSystemReady = true;
      tlog('System is ready');
      sendSplashMsg('Ready!', true);

      // Post-ready tasks
      migratePasswordsToHash(prisma, logger).catch(() => {});

    } catch (err) {
      systemError = err instanceof Error ? err : new Error(getErrorMessage(err));
      console.error('[BOOT FATAL BACKGROUND]', err);
      // done: true even on failure — main.ts must not wait forever for a
      // "ready" that will never come. It shows the window anyway; any API
      // call then surfaces this error through gatingMiddleware as it does
      // today, rather than the app appearing to hang before ever opening.
      sendSplashMsg('Initialization failed!', true);
    }
  })();
}

main().catch((err) => {
  console.error('SERVER BOOT FATAL:', err);
  process.exitCode = 1;
});

// Keep process alive (Electron main process owns lifecycle)
setInterval(() => {}, 10000);
