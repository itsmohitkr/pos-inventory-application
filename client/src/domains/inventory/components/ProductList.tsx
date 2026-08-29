import { forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import type { Batch, Product } from '@/shared/types/models';
import * as Sentry from '@sentry/react';
import { Paper, Typography, Box, Chip, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import AddProductForm from '@/domains/inventory/components/AddProductForm';

import BarcodePrintDialog from '@/domains/inventory/components/BarcodePrintDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import ProductSummaryBar from '@/domains/inventory/components/ProductSummaryBar';
import CategorySidebar from '@/domains/inventory/components/CategorySidebar';
import ProductDetailPanel from '@/domains/inventory/components/ProductDetailPanel';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';
import ProductListTable from '@/domains/inventory/components/ProductListTable';
import ProductListToolbar from '@/domains/inventory/components/ProductListToolbar';
import ProductSearchField from '@/domains/inventory/components/ProductSearchField';
import useProductList from '@/domains/inventory/components/useProductList';
import inventoryService from '@/shared/api/inventoryService';

interface ProductListProps {
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  debouncedSearch: string;
  onSearchChange: (value: string) => void;
  isPending?: boolean;
}

/** Parent pages call ref.current.refresh(). */
export interface ProductListHandle {
  refresh: () => void;
}

const ProductList = forwardRef<ProductListHandle, ProductListProps>(
  ({ categoryFilter, onCategoryChange, debouncedSearch, onSearchChange, isPending }, ref) => {
    const pl = useProductList({ categoryFilter, onCategoryChange, debouncedSearch, onSearchChange });
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(ref, () => ({
      refresh: () => {
        pl.fetchProducts();
        pl.fetchSummary();
        pl.fetchCategories();
      },
    }));

    const handleBarcodeSearch = useCallback(async (val: string) => {
      pl.setSearchTerm(val);
      if (!val) {
        pl.setFilteredProducts(null);
        return;
      }

      let found: Product | undefined = pl.products.find(
        (p) => p.barcode && p.barcode.split('|').some((b) => b.trim() === val)
      );

      if (!found) {
        try {
          const data = await inventoryService.fetchProductByBarcode(val);
          if (data && data.product) {
            const fetchedProduct: Product = data.product;
            if (data.batches) {
              fetchedProduct.total_stock = data.batches.reduce(
                (sum: number, b: Batch) => sum + b.quantity,
                0
              );
            }
            found = fetchedProduct;
          }
        } catch (error) {
          Sentry.captureException(error, { tags: { feature: 'inventory-barcode-fetch' } });
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

    const handleSearchChange = useCallback((val: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        onSearchChange(val.trim());
      }, 400);
    }, [onSearchChange, searchTimerRef]);

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          height: '100%',
          minHeight: 0,
          alignItems: 'stretch',
        }}
      >
        {/* Category Sidebar (Card 1) */}
        {pl.showCategories && (
          <Box
            sx={{
              width: { xs: '100%', lg: pl.leftPanelWidth },
              minWidth: { lg: 180 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <CategorySidebar
              sortedCategoryTree={pl.sortedCategoryTree}
              categoryCounts={pl.categoryCounts}
              expandedCategoryIds={pl.expandedCategoryIds}
              categoryFilter={categoryFilter}
              totalCount={pl.totalCount}
              uncategorizedCount={pl.uncategorizedCount}
              hasUncategorized={pl.hasUncategorized}
              categorySortOrder={pl.categorySortOrder}
              isResizingLeft={pl.isResizingLeft}
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
              onCategoryDialogClose={() => pl.setAddCategoryOpen(false)}
              onCategoryNameChange={pl.setNewCategoryName}
              onSaveCategory={pl.handleSaveCategory}
              onResizeStart={pl.handleResizeStartLeft}
              onDoubleClick={pl.displayProduct ? pl.handleOpenHistory : undefined}
              onToggleCategories={() => pl.setShowCategories(false)}
            />
          </Box>
        )}

        {/* Resizer Slider 1: Centered in gap between Card 1 & Card 2 */}
        {pl.showCategories && (
          <Box
            onMouseDown={pl.handleResizeStartLeft}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              width: '12px',
              mx: -1.5,
              cursor: 'col-resize',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              flexShrink: 0,
              '&:hover .handle': {
                bgcolor: 'primary.main',
                width: '4px',
              },
            }}
          >
            <Box
              className="handle"
              sx={{
                width: '2px',
                height: '60px',
                bgcolor: pl.isResizingLeft ? 'primary.main' : 'divider',
                borderRadius: '4px',
                transition: 'all 0.2s',
                ...(pl.isResizingLeft && { width: '4px' }),
              }}
            />
          </Box>
        )}

        {/* Product List Table (Card 2) */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minWidth: 0,
          }}
        >
          {/* Header */}
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, borderBottom: '1px solid #e2e8f0' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!pl.showCategories && (
                  <Tooltip title="Show Categories">
                    <IconButton
                      size="small"
                      onClick={() => pl.setShowCategories(true)}
                      sx={{
                        mr: 0.5,
                        bgcolor: 'rgba(31, 41, 55, 0.05)',
                        '&:hover': { bgcolor: 'rgba(31, 41, 55, 0.1)' }
                      }}
                    >
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0b1d39', lineHeight: 1.2 }}>
                    Products
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem', lineHeight: 1 }}>
                    {pl.categoryLabel}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'nowrap' }}>
                <ProductSearchField
                  searchTerm={pl.searchTerm}
                  debouncedSearch={debouncedSearch}
                  searchInputRef={pl.searchInputRef}
                  onSearchChange={handleSearchChange}
                  onBarcodeSearch={handleBarcodeSearch}
                  onClearSearch={pl.clearSearch}
                />
                <ProductListToolbar
                  stockFilter={pl.stockFilter}
                  onStockFilterChange={(value: string) => {
                    pl.setStockFilter(value);
                    onCategoryChange('all');
                  }}
                  onReset={pl.handleReset}
                  displayedProductCount={pl.displayedProducts.length}
                  hasActiveFilters={
                    categoryFilter !== 'all' ||
                    pl.searchTerm !== '' ||
                    pl.stockFilter !== 'all' ||
                    pl.sortBy !== 'name' ||
                    pl.sortOrder !== 'asc'
                  }
                  onAddProduct={pl.handleOpenAddProduct}
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
            onDoubleClick={pl.handleProductDoubleClick}
          />
        </Paper>

        {/* Resizer Slider 2: Centered in gap between Card 2 & Card 3 */}
        {pl.panelMode !== 'none' && (
          <Box
            onMouseDown={pl.handleResizeStartRight}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              width: '12px',
              mx: -1.5,
              cursor: 'col-resize',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              flexShrink: 0,
              '&:hover .handle': {
                bgcolor: 'primary.main',
                width: '4px',
              },
            }}
          >
            <Box
              className="handle"
              sx={{
                width: '2px',
                height: '60px',
                bgcolor: pl.isResizingRight ? 'primary.main' : 'divider',
                borderRadius: '4px',
                transition: 'all 0.2s',
                ...(pl.isResizingRight && { width: '4px' }),
              }}
            />
          </Box>
        )}

        {/* Product Detail / Add Product Panel (Card 3) */}
        {pl.panelMode !== 'none' && (
          <Box
            sx={{
              width: { xs: '100%', lg: pl.rightPanelWidth },
              minWidth: { lg: 320 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {pl.panelMode === 'adding' ? (
              <InventoryPanelShell
                title="Add New Product"
                headerRight={
                  <IconButton
                    size="small"
                    onClick={pl.handleCloseAddProduct}
                    aria-label="Close"
                    sx={{
                      color: '#94a3b8',
                      borderRadius: '6px',
                      '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
              >
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <AddProductForm
                    onProductAdded={() => {
                      pl.fetchProducts();
                      pl.fetchSummary();
                      pl.handleCloseAddProduct();
                    }}
                    onClose={pl.handleCloseAddProduct}
                  />
                </Box>
              </InventoryPanelShell>
            ) : pl.displayProduct ? (
              <ProductDetailPanel
                displayProduct={pl.displayProduct}
                isLoadingBatches={pl.isLoadingBatches}
                width={pl.rightPanelWidth}
                isResizing={pl.isResizingRight}
                onResizeStart={pl.handleResizeStartRight}
                onAddStock={pl.handleAddStock}
                onOpenHistory={pl.handleOpenHistory}
                onCloseHistory={pl.handleCloseHistory}
                onBatchEditClick={pl.handleBatchEditClick}
                onBatchDelete={pl.deleteBatchConfirmed}
                onQuickInventoryOpen={pl.handleQuickInventoryOpen}
                onBatchUpdated={pl.handleStockAdded}
                onToggleBatchTracking={pl.handleToggleBatchTracking}
                isTogglingBatchTracking={pl.isTogglingBatchTracking}
                onClose={pl.handleProductDoubleClick}
                onEdit={pl.handleEditClick}
                onEditProductUpdated={pl.handleEditSave}
                onDelete={pl.handleDelete}
                history={pl.historyData}
                isHistoryLoading={pl.isHistoryLoading}
                historyError={pl.historyError}
                historyRange={pl.historyRange}
                onHistoryRangeChange={pl.setHistoryRange}
                historyCustomStart={pl.historyCustomStart}
                historyCustomEnd={pl.historyCustomEnd}
                onHistoryCustomStartChange={pl.setHistoryCustomStart}
                onHistoryCustomEndChange={pl.setHistoryCustomEnd}
                isLoadingMoreHistory={pl.isLoadingMoreHistory}
                onLoadMoreHistory={pl.loadMoreHistory}
              />
            ) : null}
          </Box>
        )}
        <BarcodePrintDialog
          open={pl.barcodePrintOpen}
          onClose={() => pl.setBarcodePrintOpen(false)}
          product={pl.displayProduct}
        />
        <CustomDialog {...pl.dialogState} onClose={pl.closeDialog} />
        <Snackbar
          open={pl.notice.open}
          autoHideDuration={3000}
          onClose={() => pl.setNotice((current) => ({ ...current, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => pl.setNotice((current) => ({ ...current, open: false }))}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {pl.notice.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }
);

export default ProductList;
