require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const prisma = require('./src/config/prisma');

// Import modular routes
const productRoutes = require('./src/routes/product.routes');
const saleRoutes = require('./src/routes/sale.routes');
const reportRoutes = require('./src/routes/report.routes');
const authRoutes = require('./src/routes/auth.routes');
const categoryRoutes = require('./src/routes/category.routes');
const looseSaleRoutes = require('./src/routes/loose-sale.routes');
const promotionRoutes = require('./src/routes/promotion.routes');
const settingRoutes = require('./src/routes/setting.routes');
const settingService = require('./src/services/setting.service');
const { DEFAULT_RECEIPT_SETTINGS, DEFAULT_SHOP_METADATA } = require('./src/utils/constants');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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

// Manual SQLite Schema Migration to handle updates in packaged Electron apps
async function migrateSchema() {
    console.log('Checking database schema compatibility...');

    const addColumnSafely = async (table, column, definition) => {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
            console.log(`[MIGRATION] Added column ${column} to ${table}`);
        } catch (e) {
            if (e.message && e.message.includes('duplicate column name')) {
                console.log(`[MIGRATION] Column ${column} already exists in ${table}, skipping.`);
            } else {
                console.error(`[MIGRATION FATAL ERROR] Failed to add ${column} to ${table}. Message: ${e.message}`);
                console.error(e);
            }
            if (e.message && e.message.includes('locked')) {
                console.error(`[MIGRATION] Database locked while adding ${column} to ${table}. Please restart the app.`);
                throw new Error(`Database locked. Close other instances of the app before starting.`);
            }
        }
    };

    try {
        // 1. Ensure 'Setting' table exists (added in settings migration)
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Setting" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "key" TEXT NOT NULL,
                "value" TEXT NOT NULL,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");`);
    } catch (e) {
        console.error('Failed to create Setting table:', e);
    }

    try {
        // 2. Blindly attempt to add missing columns. This is more reliable than PRAGMA checks.
        await addColumnSafely('Batch', 'wholesaleEnabled', 'BOOLEAN NOT NULL DEFAULT 0');
        await addColumnSafely('Batch', 'wholesalePrice', 'REAL');
        await addColumnSafely('Batch', 'wholesaleMinQty', 'INTEGER');
        await addColumnSafely('SaleItem', 'isWholesale', 'BOOLEAN NOT NULL DEFAULT 0');

        console.log('Schema migration check complete.');
    } catch (error) {
        console.error('Schema migration failed structurally:', error);
        throw error;
    }
}

// Auto-seed database on first run
async function checkAndSeed() {
    try {
        await migrateSchema();

        // Check if any users exist in the database
        const userCount = await prisma.user.count();

        if (userCount === 0) {
            console.log('Database is empty. Running seed script...');

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
        await checkAndSeed();
    } catch (e) {
        console.error("Critical error during application startup:", e);
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();

// Keep process alive hack
setInterval(() => { }, 10000);
