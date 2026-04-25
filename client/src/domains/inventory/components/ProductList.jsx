import { forwardRef, useImperativeHandle, useCallback } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';

import EditProductDialog from '@/domains/inventory/components/EditProductDialog';
import EditBatchDialog from '@/domains/inventory/components/EditBatchDialog';
import AddStockDialog from '@/domains/inventory/components/AddStockDialog';
import ProductHistoryDialog from '@/domains/inventory/components/ProductHistoryDialog';
import QuickInventoryDialog from '@/domains/inventory/components/QuickInventoryDialog';
import BarcodePrintDialog from '@/domains/inventory/components/BarcodePrintDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import ProductSummaryBar from '@/domains/inventory/components/ProductSummaryBar';
import CategorySidebar from '@/domains/inventory/components/CategorySidebar';
import ProductDetailPanel from '@/domains/inventory/components/ProductDetailPanel';
import ProductListTable from '@/domains/inventory/components/ProductListTable';
import ProductListToolbar from '@/domains/inventory/components/ProductListToolbar';
import ProductSearchField from '@/domains/inventory/components/ProductSearchField';
import useProductList from '@/domains/inventory/components/useProductList';
import inventoryService from '@/shared/api/inventoryService';

const ProductList = forwardRef(
  ({ categoryFilter, onCategoryChange, debouncedSearch, onSearchChange, isPending }, ref) => {
    const pl = useProductList({ categoryFilter, onCategoryChange, debouncedSearch, onSearchChange });

    useImperativeHandle(ref, () => ({
      refresh: () => {
        pl.fetchProducts();
        pl.fetchSummary();
        pl.fetchCategories();
      },
    }));

    const handleBarcodeSearch = useCallback(async (val) => {
      pl.setSearchTerm(val);
      if (!val) return;

      let found = pl.products.find(
        (p) => p.barcode && p.barcode.split('|').some((b) => b.trim() === val)
      );

      if (!found) {
        try {
          const data = await inventoryService.fetchProductByBarcode(val);
          if (data && data.product) {
            found = data.product;
            if (data.batches) {
              found.total_stock = data.batches.reduce((sum, b) => sum + b.quantity, 0);
            }
          }
        } catch (error) {
          console.error('Barcode fetch error:', error);
        }
      }

      if (found) {
        pl.setProducts((prev) => {
          const exists = prev.find((p) => String(p.id) === String(found.id));
          return exists ? prev : [found, ...prev];
        });
        pl.setFilteredProducts([found]);
      } else {
        pl.setFilteredProducts(null);
        pl.showError(`No product found for barcode: ${val}`);
      }
    }, [pl]);

    const handleSearchChange = useCallback((val) => {
      if (pl.searchTimerRef.current) clearTimeout(pl.searchTimerRef.current);
      pl.searchTimerRef.current = setTimeout(() => {
        onSearchChange(val.trim());
      }, 400);
    }, [onSearchChange, pl.searchTimerRef]);

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: pl.showCategories
              ? pl.displayProduct
                ? `${pl.leftPanelWidth}px 1fr ${pl.rightPanelWidth}px`
                : `${pl.leftPanelWidth}px 1fr`
              : pl.displayProduct
                ? `1fr ${pl.rightPanelWidth}px`
                : '1fr',
          },
          gap: 1.5,
          height: '100%',
          minHeight: 0,
          alignItems: 'stretch',
        }}
      >
        {/* Category Sidebar */}
        {pl.showCategories && (
          <CategorySidebar
            sortedCategoryTree={pl.sortedCategoryTree}
            categoryCounts={pl.categoryCounts}
            expandedCategoryIds={pl.expandedCategoryIds}
            categoryFilter={categoryFilter}
            totalCount={pl.totalCount}
            uncategorizedCount={pl.uncategorizedCount}
            hasUncategorized={pl.hasUncategorized}
            categorySortOrder={pl.categorySortOrder}
            isResizingLeft={pl.isResizingRight}
            contextMenu={pl.contextMenu}
            activeCategory={pl.activeCategory}
            addCategoryOpen={pl.addCategoryOpen}
            newCategoryName={pl.newCategoryName}
            categoryDialogMode={pl.categoryDialogMode}
            categoryDialogParent={pl.categoryDialogParent}
            onCategorySelect={pl.handleCategorySelect}
            onCategorySortToggle={pl.handleCategorySortToggle}
            onAddCategoryDialog={pl.openAddCategoryDialog}
            onCategoryDragOver={pl.handleCategoryDragOver}
            onCategoryDrop={pl.handleCategoryDrop}
            onToggleExpand={pl.handleToggleExpand}
            onOpenCategoryMenu={pl.openCategoryMenu}
            onCloseContextMenu={pl.closeCategoryMenu}
            onAddSubcategory={pl.openAddCategoryDialog}
            onEditCategory={pl.openEditCategoryDialog}
            onDeleteCategory={pl.handleDeleteCategory}
            onCategoryDialogClose={pl.handleCategoryDialogClose}
            onCategoryNameChange={pl.setNewCategoryName}
            onSaveCategory={pl.handleSaveCategory}
            onResizeStart={pl.handleResizeStartLeft}
            onDoubleClick={pl.displayProduct ? pl.handleOpenHistory : undefined}
          />
        )}

        {/* Product List */}
        <Paper
          elevation={0}
          sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Products
                </Typography>
                <Chip
                  label={pl.categoryLabel}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(31, 41, 55, 0.15)',
                    color: '#1f2937',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '22px',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <ProductSearchField
                  searchTerm={pl.searchTerm}
                  debouncedSearch={debouncedSearch}
                  searchInputRef={pl.searchInputRef}
                  onSearchChange={handleSearchChange}
                  onBarcodeSearch={handleBarcodeSearch}
                  onClearSearch={pl.clearSearch}
                />
                <ProductListToolbar
                  showCategories={pl.showCategories}
                  onToggleCategories={() => pl.setShowCategories((prev) => !prev)}
                  stockFilter={pl.stockFilter}
                  onStockFilterChange={(value) => {
                    pl.setStockFilter(value);
                    onCategoryChange('all');
                  }}
                  onReset={pl.handleReset}
                  displayedProductCount={pl.displayedProducts.length}
                />
              </Box>
            </Box>
            <ProductSummaryBar
              summaryTotals={pl.summaryTotals}
              averageMargin={pl.averageMargin}
              averageDiscount={pl.averageDiscount}
            />
          </Box>

          <ProductListTable
            displayedProducts={pl.displayedProducts}
            selectedIds={pl.selectedIds}
            sortBy={pl.sortBy}
            sortOrder={pl.sortOrder}
            isPending={isPending}
            onSort={pl.handleSortRequest}
            onSelect={pl.handleRowClick}
            onDragStart={pl.handleListDragStart}
            onEdit={pl.handleEditClick}
            onDelete={pl.handleDelete}
            onDoubleClick={pl.handleProductDoubleClick}
          />
        </Paper>

        {/* Product Detail Panel */}
        {pl.displayProduct && (
          <ProductDetailPanel
            displayProduct={pl.displayProduct}
            isLoadingBatches={pl.isLoadingBatches}
            isResizingRight={pl.isResizingRight}
            onResizeStart={() => pl.setIsResizingRight(true)}
            onAddStock={pl.handleAddStock}
            onOpenHistory={pl.handleOpenHistory}
            onBatchEditClick={pl.handleBatchEditClick}
            onBatchDelete={pl.handleBatchDelete}
            onQuickInventoryOpen={pl.handleQuickInventoryOpen}
          />
        )}

        {/* Dialogs */}
        <ProductHistoryDialog
          open={pl.historyOpen}
          onClose={pl.handleCloseHistory}
          product={pl.displayProduct}
          history={pl.historyData}
          loading={pl.isHistoryLoading}
          range={pl.historyRange}
          onRangeChange={pl.setHistoryRange}
        />
        <EditProductDialog
          open={pl.editOpen}
          onClose={() => pl.setEditOpen(false)}
          product={pl.currentProduct}
          onProductUpdated={pl.handleEditSave}
        />
        <EditBatchDialog
          open={pl.batchEditOpen}
          onClose={() => pl.setBatchEditOpen(false)}
          batch={pl.currentBatch}
          onBatchUpdated={pl.handleBatchEditSave}
        />
        <QuickInventoryDialog
          open={pl.quickInventoryOpen}
          onClose={pl.handleQuickInventoryClose}
          batch={pl.quickInventoryBatch}
          productName={pl.displayProduct?.name}
          onUpdated={pl.handleStockAdded}
        />
        <AddStockDialog
          open={pl.addStockOpen}
          onClose={() => pl.setAddStockOpen(false)}
          product={pl.currentProduct}
          onStockAdded={pl.handleStockAdded}
        />
        <BarcodePrintDialog
          open={pl.barcodePrintOpen}
          onClose={() => pl.setBarcodePrintOpen(false)}
          product={pl.displayProduct}
        />
        <CustomDialog {...pl.dialogState} onClose={pl.closeDialog} />
      </Box>
    );
  }
);

export default ProductList;
