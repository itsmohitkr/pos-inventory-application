import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Chip,
  Slide,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import BarcodeChips from '@/domains/inventory/components/BarcodeChips';
import ProductBatchTable from '@/domains/inventory/components/ProductBatchTable';

const ProductDetailPanel = ({
  displayProduct,
  isLoadingBatches,
  width,
  isResizing,
  onResizeStart,
  onAddStock,
  onOpenHistory,
  onBatchEditClick,
  onBatchDelete,
  onQuickInventoryOpen,
  onClose,
}) => {
  return (
    <Slide direction="left" in={!!displayProduct} mountOnEnter unmountOnExit timeout={{ enter: 100, exit: 150 }}>
      <Box
        data-testid="inventory-detail-panel"
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: { xs: '100%', sm: width },
          height: '100%',
          bgcolor: '#ffffff',
          borderLeft: '2px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          boxShadow: '-15px 0 35px rgba(0,0,0,0.12), -5px 0 10px rgba(0,0,0,0.05)',
        }}
      >
        {/* Resize Handle */}
        <Box
          onMouseDown={(e) => {
            e.preventDefault();
            onResizeStart();
          }}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'absolute',
            top: 0,
            left: -4,
            width: '8px',
            height: '100%',
            cursor: 'col-resize',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            '&:hover .handle-bar': {
              bgcolor: 'primary.main',
              width: '4px',
            },
          }}
        >
          <Box
            className="handle-bar"
            sx={{
              width: '2px',
              height: '40px',
              bgcolor: isResizing ? 'primary.main' : 'divider',
              borderRadius: '4px',
              transition: 'all 0.2s',
              ...(isResizing && { width: '4px', height: '60px' }),
            }}
          />
        </Box>
        {displayProduct ? (
          <>
            {/* Header */}
            <Box
              sx={{
                p: 2,
                bgcolor: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', mb: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayProduct.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Product Details
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {displayProduct.batchTrackingEnabled && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => onAddStock(displayProduct)}
                      title="New Batch"
                      sx={{
                        bgcolor: '#1f8a5b',
                        color: '#fff',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: '#166d47' },
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1f8a5b' }}>
                      Batch
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={onOpenHistory}
                    title="Sales History"
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      '&:hover': { bgcolor: '#e2e8f0' },
                    }}
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569' }}>
                    History
                  </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 28, my: 'auto' }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label="Close"
                    sx={{
                      bgcolor: '#fef2f2',
                      color: '#ef4444',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      '&:hover': { bgcolor: '#fee2e2' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ef4444' }}>
                    Close
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#f8fafc' }}>

              {/* Product Metadata Section */}
              <Box sx={{ p: 2.5 }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: '10px', 
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff'
                  }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Primary Barcode
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <BarcodeChips barcode={displayProduct.barcode} size="medium" />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Category
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: '#0f172a' }}>
                        {displayProduct.category || 'Uncategorized'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Current Stock
                      </Typography>
                      <Typography 
                        variant="body2" 
                        data-testid="inventory-detail-total-stock"
                        sx={{ mt: 0.5, fontWeight: 700, color: displayProduct.total_stock > 0 ? '#1f8a5b' : '#ef4444' }}
                      >
                        {displayProduct.total_stock}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Batch Tracking
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={displayProduct.batchTrackingEnabled ? 'ENABLED' : 'DISABLED'} 
                          size="small"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem', 
                            fontWeight: 700,
                            bgcolor: displayProduct.batchTrackingEnabled ? '#f0fdf4' : '#fef2f2',
                            color: displayProduct.batchTrackingEnabled ? '#15803d' : '#991b1b',
                            border: `1px solid ${displayProduct.batchTrackingEnabled ? '#bbf7d0' : '#fecaca'}`
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Box>

              {/* Batch Table Section */}
              <Box sx={{ px: 2.5, pb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569', px: 0.5 }}>
                  LOTS & BATCHES
                </Typography>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    borderRadius: '10px', 
                    border: '1px solid #e2e8f0', 
                    overflow: 'hidden',
                    bgcolor: '#ffffff'
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
                </Paper>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Slide>
  );
};

export default ProductDetailPanel;
