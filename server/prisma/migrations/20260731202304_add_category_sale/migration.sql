-- CreateTable
CREATE TABLE "CategorySale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "discountPercentage" REAL NOT NULL,
    "isIndefinite" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "excludedProductIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CategorySale_category_idx" ON "CategorySale"("category");

-- CreateIndex
CREATE INDEX "CategorySale_status_idx" ON "CategorySale"("status");

