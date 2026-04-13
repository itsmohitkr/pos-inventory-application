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
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("barcode", "batchTrackingEnabled", "category", "createdAt", "id", "lowStockThreshold", "lowStockWarningEnabled", "name") SELECT "barcode", "batchTrackingEnabled", "category", "createdAt", "id", "lowStockThreshold", "lowStockWarningEnabled", "name" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE TABLE "new_SaleItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "sellingPrice" REAL NOT NULL,
    "costPrice" REAL NOT NULL,
    "mrp" REAL NOT NULL,
    "isWholesale" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SaleItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("batchId", "costPrice", "id", "isFree", "isWholesale", "mrp", "quantity", "returnedQuantity", "saleId", "sellingPrice") SELECT "batchId", "costPrice", "id", "isFree", "isWholesale", "mrp", "quantity", "returnedQuantity", "saleId", "sellingPrice" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_batchId_idx" ON "SaleItem"("batchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Batch_productId_idx" ON "Batch"("productId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "ExpensePayment_expenseId_idx" ON "ExpensePayment"("expenseId");

-- CreateIndex
CREATE INDEX "ExpensePayment_date_idx" ON "ExpensePayment"("date");

-- CreateIndex
CREATE INDEX "LooseSale_createdAt_idx" ON "LooseSale"("createdAt");

-- CreateIndex
CREATE INDEX "Promotion_startDate_endDate_idx" ON "Promotion"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "PromotionItem_promotionId_idx" ON "PromotionItem"("promotionId");

-- CreateIndex
CREATE INDEX "PromotionItem_productId_idx" ON "PromotionItem"("productId");

-- CreateIndex
CREATE INDEX "Purchase_date_idx" ON "Purchase"("date");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseItem_productId_idx" ON "PurchaseItem"("productId");

-- CreateIndex
CREATE INDEX "PurchasePayment_purchaseId_idx" ON "PurchasePayment"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchasePayment_date_idx" ON "PurchasePayment"("date");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_batchId_idx" ON "StockMovement"("batchId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");
