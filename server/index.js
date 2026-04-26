require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/prisma');
const logger = require('./src/shared/utils/logger');
const settingService = require('./src/domains/setting/setting.service');
const { DEFAULT_RECEIPT_SETTINGS, DEFAULT_SHOP_METADATA } = require('./src/config/constants');
const PORT = process.env.PORT || 5001;
const path = require('path');
const fs = require('fs');

// Back up the database file before running migrations.
// Called once at startup so a migration failure never leaves the user with an
// unrecoverable database — they can restore pos.db.bak manually.
function backupDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    // Extract the file path from "file:/path" or "file:///path"
    const dbPath = dbUrl.replace(/^file:\/\//, '').replace(/^file:/, '');
    if (!dbPath || !fs.existsSync(dbPath)) return;

    const backupPath = `${dbPath}.bak`;
    fs.copyFileSync(dbPath, backupPath);
    logger.info({ backupPath }, '[BOOT] Database backed up before migrations');
  } catch (err) {
    // Non-fatal: log and continue so a backup failure never blocks startup
    logger.warn({ err: err.message }, '[BOOT] Could not create database backup');
  }
}

// IPC Helper for Splash Screen
const sendSplashMsg = (msg) => {
  if (process.send) {
    process.send({ type: 'splash-status', message: msg });
  }
};

const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

// Auto-run Prisma migrations on startup
async function runPrismaMigrations() {
  logger.info('[BOOT MIGRATION] Running automated Prisma migrations...');
  sendSplashMsg('Applying database schemas...');
  backupDatabase();

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
      // Use execAsync so DB migrations do not block electron main process event loop
      await execAsync(
        `"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`,
        {
          env: pEnv,
          encoding: 'utf-8',
        }
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
            .map((dirent) => dirent.name);

          dirs.sort();

          for (const migration of dirs) {
            try {
              await execAsync(
                `"${nodeExecutable}" "${prismaCliPath}" migrate resolve --applied "${migration}" --schema="${schemaPath}"`,
                {
                  env: pEnv,
                }
              );
              logger.info(`[BOOT MIGRATION] Baselined migration: ${migration}`);
            } catch (resolveErr) {
              // If it fails (e.g., already applied), just ignore and continue
            }
          }

          logger.info('[BOOT MIGRATION] Running final deploy after baselining...');
          await execAsync(
            `"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`,
            {
              env: pEnv,
              encoding: 'utf-8',
            }
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

// Migrate any users still stored with a plaintext password to bcrypt hashes.
// Runs once per startup; exits silently if all passwords are already hashed.
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

// Auto-seed database on first run
async function checkAndSeed() {
  try {
    sendSplashMsg('Checking Local Database Status...');
    // Run migrations first, then hash any plaintext passwords
    await runPrismaMigrations();
    await migratePasswordsToHash();

    // Check if any users exist in the database
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      // Run essential seed script only (admin user etc)
      const { seedEssential } = require('./seed');
      await seedEssential();
      logger.info('Database initialized successfully!');
    } else {
      logger.info('Database already seeded.');
    }

    // Always ensure default settings exist
    const shopName = await settingService.getSettingByKey('posShopName');
    if (!shopName) {
      logger.info('Seeding default shop name...');
      await settingService.updateSetting('posShopName', 'My Shop');
    }

    const receiptSettings = await settingService.getSettingByKey('posReceiptSettings');
    if (!receiptSettings) {
      logger.info('Seeding default receipt settings...');
      await settingService.updateSetting('posReceiptSettings', DEFAULT_RECEIPT_SETTINGS);
    }

    const paymentSettings = await settingService.getSettingByKey('posPaymentSettings');
    if (!paymentSettings) {
      logger.info('Seeding default payment settings...');
      await settingService.updateSetting('posPaymentSettings', {
        enabledMethods: ['cash'],
        allowMultplePayment: false,
        customMethods: [],
      });
    }

    // Seed shop metadata
    for (const [key, defaultValue] of Object.entries(DEFAULT_SHOP_METADATA)) {
      const existing = await settingService.getSettingByKey(key);
      if (!existing) {
        logger.info(`Seeding default ${key}...`);
        await settingService.updateSetting(key, defaultValue);
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error checking/seeding database');
  }
}

async function startServer() {
  try {
    logger.info('[BOOT] Starting checkAndSeed with timeout...');
    sendSplashMsg('Starting core database engine...');
    // Set a timeout for DB check to prevent boot hangs
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
      logger.error(`[BOOT FATAL] Port ${PORT} is already in use. Close the other process and restart.`);
    }
    process.exit(1);
  });

  app.listen(PORT, '127.0.0.1', () => {
    logger.info(`[BOOT SUCCESS] Server running on port ${PORT} (localhost only)`);
    sendSplashMsg('Starting UI Interface...');
  });
}

try {
  startServer();
} catch (e) {
  logger.error({ error: e.message }, 'SERVER BOOT FATAL');
}

// Keep process alive hack
setInterval(() => { }, 10000);
