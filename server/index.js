require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/prisma');
const logger = require('./src/shared/utils/logger');
const settingService = require('./src/domains/setting/setting.service');
const { DEFAULT_RECEIPT_SETTINGS, DEFAULT_SHOP_METADATA } = require('./src/config/constants');
const PORT = process.env.PORT || 5001;
const path = require('path');
const fs = require('fs');

// ── IPC Helper for Splash Screen ─────────────────────────────────────────────

const sendSplashMsg = (msg) => {
  if (process.send) {
    process.send({ type: 'splash-status', message: msg });
  }
};

// ── Database backup ───────────────────────────────────────────────────────────
// Runs before migrations so a failed migration never leaves the DB unrecoverable.
// Uses async I/O to keep the event loop free during the copy.

async function backupDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const dbPath = dbUrl.replace(/^file:\/\//, '').replace(/^file:/, '');
    if (!dbPath || !fs.existsSync(dbPath)) return;
    const backupPath = `${dbPath}.bak`;
    await fs.promises.copyFile(dbPath, backupPath);
    logger.info({ backupPath }, '[BOOT] Database backed up before migrations');
  } catch (err) {
    logger.warn({ err: err.message }, '[BOOT] Could not create database backup');
  }
}

// ── Prisma migrations ─────────────────────────────────────────────────────────

const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

// Query _prisma_migrations via the already-loaded Prisma client.
// Returns the set of applied migration names, or null if the table doesn't exist yet.
async function getAppliedMigrations() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
    `;
    return new Set(rows.map((r) => r.migration_name));
  } catch {
    return null; // table missing → fresh database, all migrations are pending
  }
}

async function runPrismaMigrations() {
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  const migrationFolders = fs.existsSync(migrationsDir)
    ? fs
        .readdirSync(migrationsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

  if (migrationFolders.length > 0) {
    const applied = await getAppliedMigrations();
    const pending =
      applied === null
        ? migrationFolders
        : migrationFolders.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      logger.info('[BOOT MIGRATION] No pending migrations — skipping.');
      return;
    }
    logger.info(`[BOOT MIGRATION] ${pending.length} pending migration(s) — running deploy...`);
  }

  sendSplashMsg('Applying database schemas...');
  await backupDatabase();

  try {
    let prismaCliPath;
    let schemaPath;
    let pEnv = { ...process.env };
    let nodeExecutable = process.execPath;

    const isPackaged = process.env.NODE_ENV === 'production' || __dirname.includes('app.asar');

    if (isPackaged) {
      prismaCliPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
      schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
      pEnv.ELECTRON_RUN_AS_NODE = '1';
    } else {
      prismaCliPath = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
      schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
      nodeExecutable = process.execPath;
    }

    logger.debug({ prismaCliPath, schemaPath }, '[BOOT MIGRATION] Paths');

    try {
      await execAsync(
        `"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`,
        { env: pEnv, encoding: 'utf-8' }
      );
      logger.info('[BOOT MIGRATION] Successful');
    } catch (deployError) {
      const errorMsg = deployError.stderr || deployError.stdout || deployError.message || '';
      if (errorMsg.includes('P3005')) {
        logger.warn('[BOOT MIGRATION] P3005 Detected: Database schema not empty. Baselining...');

        const migrationsDir = path.join(path.dirname(schemaPath), 'migrations');
        if (fs.existsSync(migrationsDir)) {
          const dirs = fs
            .readdirSync(migrationsDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name)
            .sort();

          for (const migration of dirs) {
            try {
              await execAsync(
                `"${nodeExecutable}" "${prismaCliPath}" migrate resolve --applied "${migration}" --schema="${schemaPath}"`,
                { env: pEnv }
              );
              logger.info(`[BOOT MIGRATION] Baselined migration: ${migration}`);
            } catch {
              // Already applied — ignore
            }
          }

          logger.info('[BOOT MIGRATION] Running final deploy after baselining...');
          await execAsync(
            `"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`,
            { env: pEnv, encoding: 'utf-8' }
          );
          logger.info('[BOOT MIGRATION] Post-Baseline Deploy Successful');
        }
      } else {
        throw deployError;
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, '[BOOT MIGRATION FATAL]');
  }
}

// ── Password migration ────────────────────────────────────────────────────────
// Bcrypt-hashes any users still stored with plaintext passwords.
// Exits silently on repeated boots once all passwords are hashed.

async function migratePasswordsToHash() {
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

async function checkAndSeed() {
  try {
    sendSplashMsg('Checking Local Database Status...');
    await runPrismaMigrations();
    await migratePasswordsToHash();

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const { seedEssential } = require('./seed');
      await seedEssential();
      logger.info('Database initialized successfully!');
    } else {
      logger.info('Database already seeded.');
    }

    // Fetch all setting keys in one query, then write any missing ones in parallel.
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
  } catch (error) {
    logger.error({ error: error.message }, 'Error checking/seeding database');
  }
}

// ── Server startup ────────────────────────────────────────────────────────────

async function startServer() {
  try {
    logger.info('[BOOT] Starting checkAndSeed with timeout...');
    sendSplashMsg('Starting core database engine...');
    const bootstrapPromise = checkAndSeed();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database initialization timed out')), 60000)
    );

    try {
      await Promise.race([bootstrapPromise, timeoutPromise]);
      logger.info('[BOOT] Database initialization finished successfully.');
    } catch (bootstrapError) {
      logger.warn(
        { message: bootstrapError.message },
        '[BOOT WARNING] Database initialization stalled or failed'
      );
      logger.info('[BOOT] Proceeding to start server anyway...');
    }
  } catch (e) {
    logger.error({ error: e.message }, 'Critical error during application pre-startup');
  }

  app.on('error', (err) => {
    logger.error({ err: err.message, code: err.code }, '[BOOT FATAL] Express server error');
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `[BOOT FATAL] Port ${PORT} is already in use. Close the other process and restart.`
      );
    }
    process.exit(1);
  });

  app.listen(PORT, '127.0.0.1', () => {
    logger.info(`[BOOT SUCCESS] Server running on port ${PORT} (localhost only)`);
    sendSplashMsg('Starting UI Interface...');

    // Delay WhatsApp auto-reconnect so it doesn't compete with app loading.
    // Puppeteer/Chromium is CPU-heavy on Windows — give the UI 10 s to settle first.
    setTimeout(async () => {
      try {
        const whatsappService = require('./src/domains/whatsapp/whatsapp.service');
        const isWaEnabled = await whatsappService.isEnabled();
        if (isWaEnabled) {
          logger.info('[BOOT] WhatsApp enabled — auto-reconnecting session...');
          whatsappService.initializeClient();
        }
      } catch (waErr) {
        logger.warn({ err: waErr.message }, '[BOOT] Failed to auto-initialize WhatsApp');
      }
    }, 10_000);
  });
}

try {
  startServer();
} catch (e) {
  logger.error({ error: e.message }, 'SERVER BOOT FATAL');
}

// Keep process alive
setInterval(() => {}, 10000);
