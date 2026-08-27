import type { Product } from './inventoryTypes';
import React from 'react';
import { TableRow, TableCell, Box, Typography, Chip } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import BarcodeChips from '@/domains/inventory/components/BarcodeChips';

const getStockStatus = (product: Product) => {
  const totalStock = product.total_stock ?? 0;
  if (totalStock === 0) return 'zero';
  if (product.lowStockWarningEnabled && totalStock <= product.lowStockThreshold)
    return 'low';
  return 'sufficient';
};

const isUpdatedToday = (dateStr?: string | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
};

interface ProductRowProps {
  product: Product;
  index: number;
  isSelected?: boolean;
  onSelect: (product: Product, event: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onDragStart: (event: React.DragEvent, product: Product) => void;
}

const ProductRow = React.memo(
  ({
    product,
    index,
    isSelected,
    onSelect,
    onDoubleClick,
    onDragStart,
  }: ProductRowProps) => {
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
          sx={{ px: 1.5, fontWeight: 600, color: 'text.secondary', width: '50px', minWidth: '50px' }}
        >
          {index + 1}
        </TableCell>
        <TableCell sx={{ px: 1.5, minWidth: '200px' }}>
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
        <TableCell sx={{ px: 1.5, width: '170px', minWidth: '150px' }}>
          <BarcodeChips barcode={product.barcode} size="small" />
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap', px: 1.5, width: '110px', minWidth: '90px' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: statusColor }}>
            {product.total_stock}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, width: '160px', minWidth: '140px' }}>
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
      </TableRow>
    );
  }
);

export default ProductRow;
