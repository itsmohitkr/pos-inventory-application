-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "batchCode" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "mrp" REAL NOT NULL,
    "costPrice" REAL NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "wholesaleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "wholesalePrice" REAL,
    "wholesaleMinQty" INTEGER,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Batch" ("batchCode", "costPrice", "createdAt", "expiryDate", "id", "mrp", "productId", "quantity", "sellingPrice", "updatedAt", "wholesaleEnabled", "wholesaleMinQty", "wholesalePrice") SELECT "batchCode", "costPrice", "createdAt", "expiryDate", "id", "mrp", "productId", "quantity", "sellingPrice", COALESCE("createdAt", CURRENT_TIMESTAMP), "wholesaleEnabled", "wholesaleMinQty", "wholesalePrice" FROM "Batch";
DROP TABLE "Batch";
ALTER TABLE "new_Batch" RENAME TO "Batch";
CREATE INDEX "Batch_productId_idx" ON "Batch"("productId");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "category" TEXT,
    "batchTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 0,
    "lowStockWarningEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("barcode", "batchTrackingEnabled", "category", "createdAt", "deletedAt", "id", "isDeleted", "lowStockThreshold", "lowStockWarningEnabled", "name", "updatedAt") SELECT "barcode", "batchTrackingEnabled", "category", "createdAt", "deletedAt", "id", "isDeleted", "lowStockThreshold", "lowStockWarningEnabled", "name", COALESCE("createdAt", CURRENT_TIMESTAMP) FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
CREATE INDEX "Product_category_idx" ON "Product"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
