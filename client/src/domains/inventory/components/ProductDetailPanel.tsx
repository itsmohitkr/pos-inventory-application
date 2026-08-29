import type { Batch, Product } from '@/shared/types/models';
import type { ProductHistory } from '@/domains/inventory/components/inventoryTypes';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Chip,
  Switch,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  LayersOutlined as BatchIcon,
} from '@mui/icons-material';
import ProductBatchTable from '@/domains/inventory/components/ProductBatchTable';
import InlineEditProductForm from '@/domains/inventory/components/InlineEditProductForm';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';
import ProductHistoryPanelContent from '@/domains/inventory/components/ProductHistoryPanelContent';

interface ProductDetailPanelProps {
  /** Null collapses the panel. */
  displayProduct?: Product | null;
  isLoadingBatches: boolean;
  /** Panel width in px, driven by the drag handle. */
  width: number;
  isResizing: boolean;
  onResizeStart: () => void;
  onAddStock: (product: Product) => void;
  /** Opens/fetches the history for the currently displayed product. */
  onOpenHistory: () => void;
  /** Called when the panel leaves the history tab (switches to Batches, or
   * the displayed product changes), so the history-fetch effect in
   * useProductList stops re-firing on every subsequent product selection. */
  onCloseHistory?: () => void;
  onBatchEditClick: (batch: Batch) => void;
  onBatchDelete: (batchId: number) => Promise<void>;
  onQuickInventoryOpen?: (batch: Batch) => void;
  onBatchUpdated?: () => void;
  onToggleBatchTracking?: (product: Product, enabled?: boolean) => void;
  /** Disables the batch-tracking switch while a toggle request is in flight. */
  isTogglingBatchTracking?: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onEditProductUpdated?: () => void;
  onDelete?: (id: number) => void;

  // Embedded History Props
  history?: ProductHistory | null;
  isHistoryLoading?: boolean;
  historyError?: string | null;
  historyRange?: string;
  onHistoryRangeChange?: (range: string) => void;
  historyCustomStart?: string;
  historyCustomEnd?: string;
  onHistoryCustomStartChange?: (value: string) => void;
  onHistoryCustomEndChange?: (value: string) => void;
  isLoadingMoreHistory?: boolean;
  onLoadMoreHistory?: () => void;
}

const ProductDetailPanel = ({
  displayProduct,
  isLoadingBatches,
  onAddStock,
  onOpenHistory,
  onCloseHistory,
  onBatchEditClick,
  onBatchDelete,
  onQuickInventoryOpen,
  onBatchUpdated,
  onToggleBatchTracking,
  isTogglingBatchTracking,
  onClose,
  onEdit,
  onEditProductUpdated,
  onDelete,
  history,
  isHistoryLoading = false,
  historyError,
  historyRange = 'thisMonth',
  onHistoryRangeChange,
  historyCustomStart,
  historyCustomEnd,
  onHistoryCustomStartChange,
  onHistoryCustomEndChange,
  isLoadingMoreHistory,
  onLoadMoreHistory,
}: ProductDetailPanelProps) => {
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const isActionMenuOpen = Boolean(actionMenuAnchor);
  const [panelTab, setPanelTab] = useState<'batches' | 'history'>('batches');
  // Tracks the product this render's panelTab belongs to, so a change can be
  // detected and adjusted for during render (React's recommended pattern for
  // resetting state when a prop changes) instead of via a useEffect, which
  // would fire a render cycle after the prop change and race the
  // history-fetch effect in useProductList into fetching one extra product's
  // history first. useProductList resets historyOpen itself, synchronously
  // alongside selectedProduct, at every call site that changes the selection.
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [lastProductId, setLastProductId] = useState(displayProduct?.id);
  if (displayProduct?.id !== lastProductId) {
    setLastProductId(displayProduct?.id);
    setPanelTab('batches');
    setIsEditingProduct(false);
  }

  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };

  const handleEditProduct = () => {
    handleCloseActionMenu();
    setIsEditingProduct(true);
  };

  const handleDeleteProduct = () => {
    handleCloseActionMenu();
    if (displayProduct) onDelete?.(displayProduct.id);
  };

  const headerRight = displayProduct ? (
    <>
      <Tooltip title="Product Actions">
        <IconButton
          size="small"
          onClick={handleOpenActionMenu}
          aria-label="Product Actions"
          sx={{
            color: '#64748b',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(31, 41, 55, 0.08)', color: '#0f172a' },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={actionMenuAnchor}
        open={isActionMenuOpen}
        onClose={handleCloseActionMenu}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              minWidth: 160,
              py: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onEdit && (
          <MenuItem onClick={handleEditProduct} aria-label="Edit Product" sx={{ py: 1, px: 2 }}>
            <ListItemIcon sx={{ minWidth: 28, color: '#1f2937' }}>
              <EditIcon fontSize="small" data-testid="EditIcon" />
            </ListItemIcon>
            <ListItemText
              primary="Edit Product"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, color: '#1f2937' }}
            />
          </MenuItem>
        )}

        {onDelete && (
          <MenuItem onClick={handleDeleteProduct} aria-label="Delete Product" sx={{ py: 1, px: 2 }}>
            <ListItemIcon sx={{ minWidth: 28, color: '#ef4444' }}>
              <DeleteIcon fontSize="small" data-testid="DeleteIcon" />
            </ListItemIcon>
            <ListItemText
              primary="Delete Product"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, color: '#ef4444' }}
            />
          </MenuItem>
        )}
      </Menu>

      <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: '#e2e8f0' }} />

      <Tooltip title="Close Details">
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            color: '#94a3b8',
            borderRadius: '6px',
            '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  ) : undefined;

  return (
    <InventoryPanelShell title={displayProduct ? 'Product Details' : undefined} headerRight={headerRight}>
      {displayProduct ? (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 1.5, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {/* Product Details Overview / Inline Edit Card */}
          {isEditingProduct ? (
            <InlineEditProductForm
              product={displayProduct}
              onClose={() => setIsEditingProduct(false)}
              onProductUpdated={() => {
                setIsEditingProduct(false);
                onEditProductUpdated?.();
              }}
            />
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                px: 2,
                bgcolor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                flexShrink: 0,
              }}
            >
              {/* Product Name Header */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#0b1d39',
                    fontSize: '0.95rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayProduct.name}
                </Typography>

                {/* Single Row Allocated for Barcodes (Horizontal Layout) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.25 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Barcodes:
                  </Typography>
                  {displayProduct.barcode ? (
                    displayProduct.barcode.split('|').filter(Boolean).map((code, idx) => (
                      <Chip
                        key={idx}
                        label={code}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          bgcolor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.72rem' }}>
                      None
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#f1f5f9' }} />

              {/* Overview Fields Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 1.5,
                  alignItems: 'center',
                }}
              >
                {/* Cell 1: Category */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {displayProduct.category || 'Uncategorized'}
                  </Typography>
                </Box>

                {/* Cell 2: Total Quantity */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                    Total Qty
                  </Typography>
                  <Typography
                    variant="body2"
                    data-testid="inventory-detail-total-stock"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: ((displayProduct.total_stock ?? 0) > 0) ? '#059669' : '#ef4444',
                    }}
                  >
                    {displayProduct.total_stock ?? 0}
                  </Typography>
                </Box>

                {/* Cell 3: Low Stock Warning */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                    Low Stock Warning
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={displayProduct.lowStockWarningEnabled ? `≤ ${displayProduct.lowStockThreshold || 2}` : 'OFF'}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        bgcolor: displayProduct.lowStockWarningEnabled ? 'rgba(234, 88, 12, 0.12)' : '#f1f5f9',
                        color: displayProduct.lowStockWarningEnabled ? '#ea580c' : '#64748b',
                        border: 'none',
                      }}
                    />
                  </Box>
                </Box>

                {/* Cell 4: Batch Tracking Status */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                    Batch Tracking
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Switch
                      size="small"
                      checked={Boolean(displayProduct.batchTrackingEnabled)}
                      onChange={(e) => onToggleBatchTracking?.(displayProduct, e.target.checked)}
                      disabled={isTogglingBatchTracking}
                      inputProps={{ 'aria-label': 'Toggle batch tracking' }}
                      sx={{ transform: 'scale(0.75)', ml: -0.5 }}
                    />
                    <Chip
                      label={displayProduct.batchTrackingEnabled ? 'ENABLED' : 'DISABLED'}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        bgcolor: displayProduct.batchTrackingEnabled ? 'rgba(16, 185, 129, 0.12)' : '#f1f5f9',
                        color: displayProduct.batchTrackingEnabled ? '#059669' : '#64748b',
                        border: 'none',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Card 3 Sub-Tabs Navigation */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', bgcolor: '#ffffff', borderRadius: '8px', px: 1, flexShrink: 0 }}>
            <Tabs
              value={panelTab}
              onChange={(_e, val) => {
                setPanelTab(val);
                if (val === 'history') onOpenHistory();
                else onCloseHistory?.();
              }}
              sx={{
                minHeight: 38,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  minHeight: 38,
                  py: 0.5,
                  px: 1.5,
                  color: '#64748b',
                  '&.Mui-selected': { color: '#0b1d39' },
                },
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#0b1d39' },
              }}
            >
              <Tab
                value="batches"
                icon={<BatchIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label={`Lots & Batches (${displayProduct.batches?.length || 0})`}
              />
              <Tab
                value="history"
                icon={<HistoryIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Product History"
              />
            </Tabs>
          </Paper>

          {/* Sub-Tab 1: Lots & Batches View */}
          {panelTab === 'batches' && (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {isLoadingBatches && (!displayProduct.batches || displayProduct.batches.length === 0) ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>Loading batch data...</Typography>
                </Box>
              ) : displayProduct.batches && displayProduct.batches.length > 0 ? (
                <ProductBatchTable
                  batches={displayProduct.batches}
                  product={displayProduct}
                  batchTrackingEnabled={displayProduct.batchTrackingEnabled}
                  onAddStock={() => onAddStock(displayProduct)}
                  onQuickInventoryOpen={onQuickInventoryOpen}
                  onBatchEditClick={onBatchEditClick}
                  onBatchDelete={onBatchDelete}
                  onBatchUpdated={onBatchUpdated}
                />
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No active batches found for this product.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Sub-Tab 2: Stock History View */}
          {panelTab === 'history' && (
            <ProductHistoryPanelContent
              product={displayProduct}
              history={history}
              loading={isHistoryLoading}
              error={historyError}
              range={historyRange}
              onRangeChange={onHistoryRangeChange || (() => {})}
              customStart={historyCustomStart}
              customEnd={historyCustomEnd}
              onCustomStartChange={onHistoryCustomStartChange}
              onCustomEndChange={onHistoryCustomEndChange}
              isLoadingMore={isLoadingMoreHistory}
              onLoadMore={onLoadMoreHistory}
            />
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      )}
    </InventoryPanelShell>
  );
};

export default ProductDetailPanel;
