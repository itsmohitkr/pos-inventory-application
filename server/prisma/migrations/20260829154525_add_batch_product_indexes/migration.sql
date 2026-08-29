-- CreateIndex
CREATE INDEX "Batch_productId_isDeleted_idx" ON "Batch"("productId", "isDeleted");

-- CreateIndex
CREATE INDEX "Batch_expiryDate_idx" ON "Batch"("expiryDate");

-- CreateIndex
CREATE INDEX "Product_isDeleted_category_idx" ON "Product"("isDeleted", "category");
