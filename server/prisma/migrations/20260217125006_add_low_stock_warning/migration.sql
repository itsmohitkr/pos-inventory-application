-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "category" TEXT,
    "batchTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 0,
    "lowStockWarningEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("barcode", "batchTrackingEnabled", "category", "createdAt", "id", "name") SELECT "barcode", "batchTrackingEnabled", "category", "createdAt", "id", "name" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
