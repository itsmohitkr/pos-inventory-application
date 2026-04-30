-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "totalSpend" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "lastVisit" DATETIME;

-- CreateIndex
CREATE INDEX "Customer_totalSpend_idx" ON "Customer"("totalSpend");
