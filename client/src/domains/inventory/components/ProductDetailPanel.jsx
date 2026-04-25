import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import BarcodeChips from '@/domains/inventory/components/BarcodeChips';
import ProductBatchTable from '@/domains/inventory/components/ProductBatchTable';

const ProductDetailPanel = ({
  displayProduct,
  isLoadingBatches,
  isResizingRight,
  onResizeStart,
  onAddStock,
  onOpenHistory,
  onBatchEditClick,
  onBatchDelete,
  onQuickInventoryOpen,
}) => {
  return (
    <Paper
      data-testid="inventory-detail-panel"
      elevation={0}
      sx={{
        p: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Left resize handle */}
      <Box
        onMouseDown={(e) => {
          e.preventDefault();
          onResizeStart();
        }}
        sx={{
          display: { xs: 'none', lg: 'flex' },
          position: 'absolute',
          top: 0,
          left: 0,
          width: '8px',
          height: '100%',
          cursor: 'col-resize',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover .handle': {
            bgcolor: 'primary.main',
            width: '4px',
          },
          zIndex: 10,
        }}
      >
        <Box
          className="handle"
          sx={{
            width: '2px',
            height: '60px',
            bgcolor: isResizingRight ? 'primary.main' : 'divider',
            borderRadius: '4px',
            transition: 'all 0.2s',
            ...(isResizingRight && { width: '4px' }),
          }}
        />
      </Box>

      {displayProduct ? (
        <>
          {/* Header: product name, action buttons */}
          <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(16, 24, 40, 0.08)' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h5" component="h2" sx={{ wordBreak: 'break-word' }}>
                  {displayProduct.name}
                </Typography>
                {displayProduct.batchTrackingEnabled && (
                  <Chip
                    label="Batch Tracking Enabled"
                    size="small"
                    color="primary"
                    variant="filled"
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {displayProduct.batchTrackingEnabled && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <IconButton
                      size="medium"
                      onClick={() => onAddStock(displayProduct)}
                      sx={{
                        bgcolor: '#1f8a5b',
                        color: '#fff',
                        '&:hover': { bgcolor: '#166d47' },
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#1f8a5b' }}
                    >
                      Batch
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <IconButton
                    size="medium"
                    onClick={onOpenHistory}
                    sx={{
                      bgcolor: 'rgba(31, 41, 55, 0.08)',
                      color: '#1f2937',
                      '&:hover': { bgcolor: 'rgba(31, 41, 55, 0.15)' },
                    }}
                  >
                    <HistoryIcon />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#1f2937' }}
                  >
                    History
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Product metadata */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Barcode
                </Typography>
                <BarcodeChips barcode={displayProduct.barcode} size="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {displayProduct.category || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Stock
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  data-testid="inventory-detail-total-stock"
                >
                  {displayProduct.total_stock}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Batch Tracking
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {displayProduct.batchTrackingEnabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Batches / Stock lots */}
          {isLoadingBatches ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">Loading batches...</Typography>
            </Box>
          ) : displayProduct.batches && displayProduct.batches.length > 0 ? (
            <ProductBatchTable
              batches={displayProduct.batches}
              batchTrackingEnabled={displayProduct.batchTrackingEnabled}
              onQuickInventoryOpen={onQuickInventoryOpen}
              onBatchEditClick={onBatchEditClick}
              onBatchDelete={onBatchDelete}
            />
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No stock available
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Select a product
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click on any product from the list to view details
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ProductDetailPanel;
