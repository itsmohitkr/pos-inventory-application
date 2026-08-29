import type { Batch } from '@/shared/types/models';
import React from 'react';
import { formatPrice } from '@/shared/utils/priceUtils';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddStockIcon,
  Event as ExpiryIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface ProductBatchTableProps {
  batches: Batch[];
  /** Shows the batch-code and expiry columns when true. */
  batchTrackingEnabled?: boolean;
  onAddStock?: () => void;
  onQuickInventoryOpen: (batch: Batch) => void;
  onBatchEditClick: (batch: Batch) => void;
  onBatchDelete: (batchId: number) => void;
}

const ProductBatchTable = ({
  batches,
  batchTrackingEnabled = false,
  onAddStock,
  onQuickInventoryOpen,
  onBatchEditClick,
  onBatchDelete,
}: ProductBatchTableProps) => {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Section Action Bar */}
      {batchTrackingEnabled && onAddStock && (
        <Box
          sx={{
            py: 0.5,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={onAddStock}
            sx={{
              height: '30px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderColor: '#e2e8f0',
              color: '#0b1d39',
              bgcolor: '#ffffff',
              borderRadius: '6px',
              px: 1.25,
              py: 0.25,
              boxShadow: 'none',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc',
              },
            }}
          >
            New Batch
          </Button>
        </Box>
      )}

      {/* Batch Cards Container (Overlay scrollbar in right margin space) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflowY: 'auto',
          // @ts-expect-error - Chrome/Electron overlay scrollbar prevents layout shifting
          overflowY: 'overlay',
          pr: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar': {
            width: '5px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#94a3b8',
          },
        }}
      >
        {batches.map((batch) => {
          const margin =
            batch.sellingPrice > 0
              ? (((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100).toFixed(1)
              : '0.0';
          const discount =
            batch.mrp > 0
              ? (((batch.mrp - batch.sellingPrice) / batch.mrp) * 100).toFixed(1)
              : '0.0';
          const numMargin = Number(margin);

          return (
            <Paper
              key={batch.id}
              elevation={0}
              data-testid={`inventory-batch-row-${batch.id}`}
              sx={{
                p: 1.5,
                px: 2,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#94a3b8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
              }}
            >
              {/* Batch Code & Quantity Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
                    Batch ID:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: '#334155',
                      fontSize: '0.75rem',
                      bgcolor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      px: 0.85,
                      py: 0.25,
                      borderRadius: '5px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {batchTrackingEnabled && batch.batchCode ? batch.batchCode : 'Standard Lot'}
                  </Typography>
                </Box>

                <Chip
                  label={`${batch.quantity} in stock`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: batch.quantity > 0 ? 'rgba(16, 185, 129, 0.12)' : '#fef2f2',
                    color: batch.quantity > 0 ? '#059669' : '#ef4444',
                    border: 'none',
                  }}
                />
              </Box>

              {/* Pricing & Financial Metrics Grid: MRP, CP, SP, Margin, Discount */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 0.75,
                  bgcolor: '#f8fafc',
                  p: 1,
                  borderRadius: '6px',
                  border: 'none',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    MRP
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    ₹{formatPrice(batch.mrp)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Cost (CP)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#ea580c', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    ₹{formatPrice(batch.costPrice)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Selling (SP)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    ₹{formatPrice(batch.sellingPrice)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Margin
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      color:
                        numMargin > 20
                          ? '#059669'
                          : numMargin > 10
                            ? '#d97706'
                            : '#ef4444',
                    }}
                  >
                    {margin}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Discount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {discount}%
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#f1f5f9' }} />

              {/* Expiry & Action Buttons Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ExpiryIcon sx={{ fontSize: 13, color: batch.expiryDate ? '#64748b' : '#94a3b8' }} />
                  <Typography variant="caption" sx={{ color: batch.expiryDate ? '#475569' : '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>
                    {batch.expiryDate
                      ? `EXP: ${new Date(batch.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'EXP: N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Tooltip title="Quick Stock Update">
                    <IconButton
                      size="small"
                      onClick={() => onQuickInventoryOpen(batch)}
                      data-testid={`inventory-quick-stock-${batch.id}`}
                      aria-label="Quick Stock Update"
                      sx={{
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
                      }}
                    >
                      <AddStockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Edit Batch Details">
                    <IconButton
                      size="small"
                      onClick={() => onBatchEditClick(batch)}
                      aria-label="Edit Batch Details"
                      sx={{
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete Batch">
                    <IconButton
                      size="small"
                      onClick={() => onBatchDelete(batch.id)}
                      aria-label="Delete Batch"
                      sx={{
                        border: '1px solid #fecaca',
                        color: '#ef4444',
                        bgcolor: '#fef2f2',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: '#fee2e2' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProductBatchTable;
