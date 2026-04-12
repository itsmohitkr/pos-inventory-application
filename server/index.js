require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./src/config/prisma');
const logger = require('./src/shared/utils/logger');

logger.info('[BOOT] index.js loaded. Starting server initialization...');

// Import modular routes
const productRoutes = require('./src/domains/product/product.router');
const categoryRoutes = require('./src/domains/category/category.router');
const saleRoutes = require('./src/domains/sale/sale.router');
const reportRoutes = require('./src/domains/report/report.router');
const authRoutes = require('./src/domains/auth/auth.router');
const looseSaleRoutes = require('./src/domains/loose-sale/loose-sale.router');
const promotionRoutes = require('./src/domains/promotion/promotion.router');
const expenseRoutes = require('./src/domains/expense/expense.router');
const purchaseRoutes = require('./src/domains/purchase/purchase.router');
const settingRoutes = require('./src/domains/setting/setting.router');
const settingService = require('./src/domains/setting/setting.service');
const { DEFAULT_RECEIPT_SETTINGS, DEFAULT_SHOP_METADATA } = require('./src/config/constants');
const pathNotFound = require('./src/shared/error/pathNotFound');
const errorHandler = require('./src/shared/error/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// Production security middleware
app.use(helmet());
app.use(cors()); // Configure specific origins in production if needed
app.use(bodyParser.json());

// Rate limiting for sensitive routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming Request');
  next();
});

// Main API Router
const apiRouter = express.Router();
apiRouter.use('/auth', authLimiter, authRoutes);
apiRouter.use(productRoutes);
apiRouter.use(categoryRoutes);
apiRouter.use(saleRoutes);
apiRouter.use(reportRoutes);
apiRouter.use(looseSaleRoutes);
apiRouter.use(promotionRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/purchases', purchaseRoutes);
apiRouter.use('/settings', settingRoutes);

app.use('/api', apiRouter);
app.use(pathNotFound);
app.use(errorHandler);

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
      const { stdout } = await execAsync(
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
          const { stdout } = await execAsync(
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

// Auto-seed database on first run
async function checkAndSeed() {
  try {
    sendSplashMsg('Checking Local Database Status...');
    // Run migrations first
    await runPrismaMigrations();

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
      await settingService.updateSetting('posShopName', 'Bachat Bazaar');
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
      setTimeout(() => reject(new Error('Database initialization timed out')), 10000)
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

  app.listen(PORT, () => {
    logger.info(`[BOOT SUCCESS] Server running on port ${PORT}`);
    sendSplashMsg('Starting UI Interface...');
  });
}

try {
  startServer();
} catch (e) {
  logger.error({ error: e.message }, 'SERVER BOOT FATAL');
}

// Keep process alive hack
setInterval(() => {}, 10000);
