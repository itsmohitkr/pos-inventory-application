import React from 'react';
import { TableRow, TableCell, IconButton, Box, Typography, Chip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Circle as CircleIcon } from '@mui/icons-material';
import BarcodeChips from '@/domains/inventory/components/BarcodeChips';

const getStockStatus = (product) => {
  if (product.total_stock === 0) return 'zero';
  if (product.lowStockWarningEnabled && product.total_stock <= product.lowStockThreshold)
    return 'low';
  return 'sufficient';
};

const isUpdatedToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
};

const ProductRow = React.memo(
  ({ product, index, isSelected, onSelect, onEdit, onDelete, onDoubleClick, onDragStart }) => {
    const stockStatus = getStockStatus(product);
    const statusColor =
      stockStatus === 'zero' ? '#ef4444' : stockStatus === 'low' ? '#7c3aed' : '#10b981';
    const updatedToday = isUpdatedToday(product.lastUpdatedAt);

    return (
      <TableRow
        hover
        draggable={true}
        onDragStart={(e) => onDragStart(e, product)}
        onClick={(e) => onSelect(product, e)}
        onDoubleClick={() => onDoubleClick && onDoubleClick()}
        sx={{
          cursor: 'pointer',
          bgcolor: isSelected ? 'rgba(11, 29, 57, 0.08)' : 'transparent',
          '& td': { px: 1.5 },
        }}
      >
        <TableCell
          sx={{ px: 1.5, fontWeight: 600, color: 'text.secondary', width: '30px' }}
        >
          {index + 1}
        </TableCell>
        <TableCell sx={{ px: 1.5, minWidth: '220px', maxWidth: '220px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircleIcon sx={{ fontSize: 10, color: statusColor, opacity: 0.8 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                }}
              >
                {product.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {product.category || 'Uncategorized'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ px: 1.5, minWidth: '200px', maxWidth: '200px' }}>
          <BarcodeChips barcode={product.barcode} size="small" />
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <Chip
            label={product.batchTrackingEnabled ? 'Enabled' : 'Disabled'}
            size="small"
            sx={{
              height: '20px',
              fontSize: '0.65rem',
              fontWeight: 600,
              bgcolor: product.batchTrackingEnabled ? 'rgba(11, 29, 57, 0.08)' : '#f1f5f9',
              color: product.batchTrackingEnabled ? '#0b1d39' : '#475569',
              border: 'none',
            }}
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <Chip
            label={product.lowStockWarningEnabled ? 'Enabled' : 'Disabled'}
            size="small"
            sx={{
              height: '20px',
              fontSize: '0.65rem',
              fontWeight: 600,
              bgcolor: product.lowStockWarningEnabled ? 'rgba(217, 119, 6, 0.1)' : '#f1f5f9',
              color: product.lowStockWarningEnabled ? '#d97706' : '#475569',
              border: 'none',
            }}
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: statusColor }}>
            {product.total_stock}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          {product.lastUpdatedAt ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: updatedToday ? '#059669' : 'text.primary' }}>
                  {new Date(product.lastUpdatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
                {updatedToday && (
                  <Chip
                    label="Today"
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#d1fae5', color: '#065f46', border: 'none' }}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: updatedToday ? '#10b981' : 'text.secondary' }}>
                {new Date(product.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">—</Typography>
          )}
        </TableCell>
        <TableCell
          onClick={(e) => e.stopPropagation()}
          sx={{ whiteSpace: 'nowrap', px: 1.5 }}
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
              <IconButton
                size="small"
                onClick={() => onEdit(product)}
                aria-label="Edit Product"
                sx={{
                  bgcolor: 'rgba(31, 41, 55, 0.08)',
                  color: '#1f2937',
                  '&:hover': { bgcolor: 'rgba(31, 41, 55, 0.15)' },
                }}
              >
                <EditIcon fontSize="small" data-testid="EditIcon" />
              </IconButton>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1f2937' }}
              >
                Edit
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
              <IconButton
                size="small"
                onClick={() => onDelete(product.id)}
                aria-label="Delete Product"
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                }}
              >
                <DeleteIcon fontSize="small" data-testid="DeleteIcon" />
              </IconButton>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ef4444' }}
              >
                Delete
              </Typography>
            </Box>
          </Box>
        </TableCell>
      </TableRow>
    );
  }
);

export default ProductRow;
