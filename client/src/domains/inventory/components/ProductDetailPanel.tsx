import type { Batch, Product } from '@/shared/types/models';
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
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Inventory2Outlined as StockIcon,
  CategoryOutlined as CategoryIcon,
  LayersOutlined as BatchIcon,
  CheckCircleOutlined as StatusIcon,
  TuneOutlined as ModeIcon,
} from '@mui/icons-material';
import ProductBatchTable from '@/domains/inventory/components/ProductBatchTable';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';

interface ProductDetailPanelProps {
  /** Null collapses the panel. */
  displayProduct?: Product | null;
  isLoadingBatches: boolean;
  /** Panel width in px, driven by the drag handle. */
  width: number;
  isResizing: boolean;
  onResizeStart: () => void;
  onAddStock: (product: Product) => void;
  /** Opens the history dialog for the currently displayed product. */
  onOpenHistory: () => void;
  onBatchEditClick: (batch: Batch) => void;
  onBatchDelete: (batchId: number) => void;
  onQuickInventoryOpen: (batch: Batch) => void;
  onToggleBatchTracking?: (product: Product, enabled?: boolean) => void;
  /** Disables the batch-tracking switch while a toggle request is in flight. */
  isTogglingBatchTracking?: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
}

const ProductDetailPanel = ({
  displayProduct,
  isLoadingBatches,
  onAddStock,
  onOpenHistory,
  onBatchEditClick,
  onBatchDelete,
  onQuickInventoryOpen,
  onToggleBatchTracking,
  isTogglingBatchTracking,
  onClose,
  onEdit,
  onDelete,
}: ProductDetailPanelProps) => {
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const isActionMenuOpen = Boolean(actionMenuAnchor);

  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };

  const handleEditProduct = () => {
    handleCloseActionMenu();
    if (displayProduct) onEdit?.(displayProduct);
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

        <MenuItem
          onClick={() => {
            handleCloseActionMenu();
            onOpenHistory();
          }}
          aria-label="Product History"
          sx={{ py: 1, px: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: '#1f2937' }}>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Product History"
            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, color: '#1f2937' }}
          />
        </MenuItem>

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
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 1.5, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Product Details Overview Card */}
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

              <Divider sx={{ borderColor: '#f1f5f9' }} />

              {/* Overview Fields Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
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
                      color: (displayProduct.total_stock ?? 0) > 0 ? '#059669' : '#ef4444',
                    }}
                  >
                    {displayProduct.total_stock}
                  </Typography>
                </Box>

                {/* Cell 3: Batch Tracking */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                    Batch Tracking
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Switch
                      size="small"
                      checked={!!displayProduct.batchTrackingEnabled}
                      onChange={(e) => onToggleBatchTracking?.(displayProduct, e.target.checked)}
                      disabled={!onToggleBatchTracking || isTogglingBatchTracking}
                      color="primary"
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

            {/* Lots & Batches Section Wrapper */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {isLoadingBatches ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>Loading batch data...</Typography>
                </Box>
              ) : displayProduct.batches && displayProduct.batches.length > 0 ? (
                <ProductBatchTable
                  batches={displayProduct.batches}
                  batchTrackingEnabled={displayProduct.batchTrackingEnabled}
                  onAddStock={() => onAddStock(displayProduct)}
                  onQuickInventoryOpen={onQuickInventoryOpen}
                  onBatchEditClick={onBatchEditClick}
                  onBatchDelete={onBatchDelete}
                />
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No active batches found for this product.
                  </Typography>
                </Box>
              )}
            </Box>
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
