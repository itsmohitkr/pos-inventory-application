require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const prisma = require('./src/config/prisma');
console.error('[BOOT] index.js loaded. Starting server initialization...');

// Import modular routes
const productRoutes = require('./src/routes/product.routes');
const saleRoutes = require('./src/routes/sale.routes');
const reportRoutes = require('./src/routes/report.routes');
const authRoutes = require('./src/routes/auth.routes');
const categoryRoutes = require('./src/routes/category.routes');
const looseSaleRoutes = require('./src/routes/loose-sale.routes');
const promotionRoutes = require('./src/routes/promotion.routes');
const expenseRoutes = require('./src/routes/expense.routes');
const purchaseRoutes = require('./src/routes/purchase.routes');
const settingRoutes = require('./src/routes/setting.routes');
const settingService = require('./src/services/setting.service');
const { DEFAULT_RECEIPT_SETTINGS, DEFAULT_SHOP_METADATA } = require('./src/utils/constants');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
    // ...existing code...
    next();
});

// Main API Router
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const { execSync } = require('child_process');
const path = require('path');

// Auto-run Prisma migrations on startup
function runPrismaMigrations() {
    console.error('[BOOT MIGRATION] Running automated Prisma migrations...');

    try {
        let prismaCliPath;
        let schemaPath;
        let pEnv = { ...process.env };
        let nodeExecutable = process.execPath;

        // Check if running inside packaged app
        const isPackaged = process.env.NODE_ENV === 'production' || __dirname.includes('app.asar');

        if (isPackaged) {
            // Paths relative to 'server' folder unpacked outside app.asar
            prismaCliPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
            schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
            pEnv.ELECTRON_RUN_AS_NODE = '1';
        } else {
            // Standard paths when running 'npm run dev'
            prismaCliPath = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
            schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
            // Ensure we use the exact node executable in dev
            nodeExecutable = process.execPath;
        }

        console.error('[BOOT MIGRATION] Prisma CLI Path:', prismaCliPath);
        console.error('[BOOT MIGRATION] Schema Path:', schemaPath);

        // Use execSync so DB migrations block server startup
        const output = execSync(`"${nodeExecutable}" "${prismaCliPath}" migrate deploy --schema="${schemaPath}"`, {
            env: pEnv,
            encoding: 'utf-8'
        });

        console.error('[BOOT MIGRATION] Successful:\n', output);
    } catch (error) {
        console.error('[BOOT MIGRATION FATAL]:\n', error.stdout || error.message);
    }
}

// Auto-seed database on first run
async function checkAndSeed() {
    try {
        // Run migrations first
        runPrismaMigrations();

        // Check if any users exist in the database
        const userCount = await prisma.user.count();

        if (userCount === 0) {
            // ...existing code...

            // Run essential seed script only (admin user etc)
            const { seedEssential } = require('./seed');
            await seedEssential();
            console.log('Database initialized successfully!');
        } else {
            console.log('Database already seeded.');
        }

        // Always ensure default settings exist
        const shopName = await settingService.getSettingByKey('posShopName');
        if (!shopName) {
            console.log('Seeding default shop name...');
            await settingService.updateSetting('posShopName', 'Bachat Bazaar');
        }

        const receiptSettings = await settingService.getSettingByKey('posReceiptSettings');
        if (!receiptSettings) {
            console.log('Seeding default receipt settings...');
            await settingService.updateSetting('posReceiptSettings', DEFAULT_RECEIPT_SETTINGS);
        }

        const paymentSettings = await settingService.getSettingByKey('posPaymentSettings');
        if (!paymentSettings) {
            console.log('Seeding default payment settings...');
            await settingService.updateSetting('posPaymentSettings', {
                enabledMethods: ['cash'],
                allowMultplePayment: false,
                customMethods: []
            });
        }

        // Seed shop metadata
        for (const [key, defaultValue] of Object.entries(DEFAULT_SHOP_METADATA)) {
            const existing = await settingService.getSettingByKey(key);
            if (!existing) {
                console.log(`Seeding default ${key}...`);
                await settingService.updateSetting(key, defaultValue);
            }
        }
    } catch (error) {
        console.error('Error checking/seeding database:', error);
    }
}

async function startServer() {
    try {
        console.error('[BOOT] Starting checkAndSeed with timeout...');
        // Set a timeout for DB check to prevent boot hangs
        const bootstrapPromise = checkAndSeed();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database initialization timed out')), 10000)
        );

        try {
            await Promise.race([bootstrapPromise, timeoutPromise]);
            console.error('[BOOT] Database initialization finished successfully.');
        } catch (bootstrapError) {
            console.error('[BOOT WARNING] Database initialization stalled or failed:', bootstrapError.message);
            console.error('[BOOT] Proceeding to start server anyway...');
        }
    } catch (e) {
        console.error("Critical error during application pre-startup:", e);
    }

    app.listen(PORT, () => {
        console.error(`[BOOT SUCCESS] Server running on port ${PORT}`);
    });
}

try {
    startServer();
} catch (e) {
    console.error('SERVER BOOT FATAL:', e);
}

// Keep process alive hack
setInterval(() => { }, 10000);
