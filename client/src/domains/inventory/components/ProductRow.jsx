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

const ProductRow = React.memo(
  ({ product, index, isSelected, onSelect, onEdit, onDelete, onDoubleClick, onDragStart }) => {
    const stockStatus = getStockStatus(product);
    const statusColor =
      stockStatus === 'zero' ? '#ef4444' : stockStatus === 'low' ? '#7c3aed' : '#10b981';

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
        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircleIcon sx={{ fontSize: 12, color: statusColor }} />
            <Box>
              <Typography variant="body1">{product.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {product.category || 'Uncategorized'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <BarcodeChips barcode={product.barcode} size="small" />
        </TableCell>
        <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <Chip
            label={product.batchTrackingEnabled ? 'Enabled' : 'Disabled'}
            size="small"
            color={product.batchTrackingEnabled ? 'primary' : 'default'}
            variant={product.batchTrackingEnabled ? 'filled' : 'outlined'}
            sx={{ height: '20px', fontSize: '0.65rem', fontWeight: 700 }}
          />
        </TableCell>
        <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <Chip
            label={product.lowStockWarningEnabled ? 'Enabled' : 'Disabled'}
            size="small"
            color={product.lowStockWarningEnabled ? 'warning' : 'default'}
            variant={product.lowStockWarningEnabled ? 'filled' : 'outlined'}
            sx={{
              height: '20px',
              fontSize: '0.65rem',
              fontWeight: 700,
              ...(product.lowStockWarningEnabled && {
                bgcolor: 'rgba(217, 119, 6, 0.1)',
                color: '#d97706',
                borderColor: '#d97706',
              }),
            }}
          />
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          <Typography variant="body1">{product.total_stock}</Typography>
        </TableCell>
        <TableCell
          align="right"
          onClick={(e) => e.stopPropagation()}
          sx={{ whiteSpace: 'nowrap', px: 1.5 }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
              <IconButton
                size="small"
                onClick={() => onEdit(product)}
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
