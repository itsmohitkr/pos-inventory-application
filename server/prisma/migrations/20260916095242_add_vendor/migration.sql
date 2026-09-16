-- CreateTable
CREATE TABLE "Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendor" TEXT,
    "vendorId" INTEGER,
    "totalAmount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Paid',
    "paymentMethod" TEXT DEFAULT 'Cash',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("createdAt", "date", "id", "note", "paymentMethod", "paymentStatus", "totalAmount", "updatedAt", "vendor") SELECT "createdAt", "date", "id", "note", "paymentMethod", "paymentStatus", "totalAmount", "updatedAt", "vendor" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE INDEX "Purchase_date_idx" ON "Purchase"("date");
CREATE INDEX "Purchase_vendorId_idx" ON "Purchase"("vendorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

