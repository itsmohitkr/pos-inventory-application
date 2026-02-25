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
    // ...existing code...

    const addColumnSafely = async (table, column, definition) => {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
            // ...existing code...
        } catch (e) {
            if (e.message && e.message.includes('duplicate column name')) {
                // ...existing code...
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
        // 0. Ensure 'User' table exists (CRITICAL for login)
        console.error('[MIGRATION] Ensuring User table exists...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "User" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "username" TEXT NOT NULL,
                "password" TEXT NOT NULL,
                "role" TEXT NOT NULL DEFAULT 'cashier',
                "status" TEXT NOT NULL DEFAULT 'active',
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`);

        // 0.a Failsafe admin seed (Direct SQL to bypass high-level failures)
        await prisma.$executeRawUnsafe(`
            INSERT OR IGNORE INTO "User" (username, password, role, status, createdAt, updatedAt)
            VALUES ('admin', 'admin123', 'admin', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `);

        // 1. Ensure 'Category' exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Category" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "name" TEXT NOT NULL,
                "parentId" INTEGER,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_parentId_key" ON "Category"("name", "parentId");`);

        // 2. Ensure 'Product' exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Product" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "name" TEXT NOT NULL,
                "barcode" TEXT,
                "category" TEXT,
                "batchTrackingEnabled" BOOLEAN NOT NULL DEFAULT 0,
                "lowStockThreshold" INTEGER NOT NULL DEFAULT 0,
                "lowStockWarningEnabled" BOOLEAN NOT NULL DEFAULT 0,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Product_barcode_key" ON "Product"("barcode");`);

        // 3. Ensure 'Batch' exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Batch" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "productId" INTEGER NOT NULL,
                "batchCode" TEXT,
                "quantity" INTEGER NOT NULL DEFAULT 0,
                "mrp" REAL NOT NULL,
                "costPrice" REAL NOT NULL,
                "sellingPrice" REAL NOT NULL,
                "wholesaleEnabled" BOOLEAN NOT NULL DEFAULT 0,
                "wholesalePrice" REAL,
                "wholesaleMinQty" INTEGER,
                "expiryDate" DATETIME,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );
        `);

        // 4. Ensure 'Sale' exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Sale" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "totalAmount" REAL NOT NULL,
                "discount" REAL NOT NULL DEFAULT 0,
                "extraDiscount" REAL NOT NULL DEFAULT 0,
                "paymentMethod" TEXT NOT NULL DEFAULT 'Cash',
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. Ensure 'SaleItem' exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "SaleItem" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "saleId" INTEGER NOT NULL,
                "batchId" INTEGER NOT NULL,
                "quantity" INTEGER NOT NULL,
                "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
                "sellingPrice" REAL NOT NULL,
                "costPrice" REAL NOT NULL,
                "mrp" REAL NOT NULL,
                "isWholesale" BOOLEAN NOT NULL DEFAULT 0,
                CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "SaleItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );
        `);

        // 6. Ensure 'StockMovement' exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "StockMovement" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "productId" INTEGER NOT NULL,
                "batchId" INTEGER,
                "type" TEXT NOT NULL,
                "quantity" INTEGER NOT NULL,
                "note" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);

        // 7. Ensure 'LooseSale' exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "LooseSale" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "itemName" TEXT,
                "price" REAL NOT NULL,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 8. Ensure 'Setting' table exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Setting" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "key" TEXT NOT NULL,
                "value" TEXT NOT NULL,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");`);

        // 9. Ensure 'Promotion' and 'PromotionItem' tables exist
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Promotion" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "name" TEXT NOT NULL,
                "startDate" DATETIME NOT NULL,
                "endDate" DATETIME NOT NULL,
                "isActive" BOOLEAN NOT NULL DEFAULT 1,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PromotionItem" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "promotionId" INTEGER NOT NULL,
                "productId" INTEGER NOT NULL,
                "promoPrice" REAL NOT NULL,
                "discountPercentage" REAL,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PromotionItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "PromotionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);
    } catch (e) {
        console.error('Failed to create tables:', e);
    }

    try {
        // 2. Blindly attempt to add missing columns. This is more reliable than PRAGMA checks.
        await addColumnSafely('Batch', 'wholesaleEnabled', 'BOOLEAN NOT NULL DEFAULT 0');
        await addColumnSafely('Batch', 'wholesalePrice', 'REAL');
        await addColumnSafely('Batch', 'wholesaleMinQty', 'INTEGER');
        await addColumnSafely('SaleItem', 'isWholesale', 'BOOLEAN NOT NULL DEFAULT 0');
        await addColumnSafely('Sale', 'paymentMethod', 'TEXT NOT NULL DEFAULT "Cash"');

        // ...existing code...
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
