import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from '@mui/material';
import type { StockMovement, StockMovementPagination } from '@/domains/inventory/components/inventoryTypes';

interface ProductHistoryMovementDetailsTabProps {
  movements: StockMovement[];
  pagination?: StockMovementPagination;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  formatDate: (value?: string | null) => string;
  formatTime: (value?: string | null) => string;
}

const movementTypeFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'added', label: 'Added' },
  { value: 'sold', label: 'Sold' },
  { value: 'returned', label: 'Returned' },
  { value: 'adjustment_in', label: 'Adjust +' },
  { value: 'adjustment_out', label: 'Adjust -' },
];

const batchLabel = (batch?: { batchCode?: string | null; sellingPrice?: number | null } | null): string => {
  if (!batch) return '—';
  if (batch.batchCode) return batch.batchCode;
  if (batch.sellingPrice != null) return `₹${batch.sellingPrice.toFixed(2)}`;
  return 'N/A';
};

const getMovementDetails = (type: string, quantity: number) => {
  switch (type) {
    case 'added':
      return { label: 'Added', color: '#059669', bg: '#d1fae5', border: '#a7f3d0', prefix: '+' };
    case 'sold':
      return { label: 'Sold', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', prefix: '-' };
    case 'returned':
      return { label: 'Returned', color: '#0284c7', bg: '#e0f2fe', border: '#93c5fd', prefix: '+' };
    case 'adjustment_in':
      return { label: 'Adjust +', color: '#d97706', bg: '#fef3c7', border: '#fde68a', prefix: '+' };
    case 'adjustment_out':
      return { label: 'Adjust -', color: '#d97706', bg: '#fef3c7', border: '#fde68a', prefix: '-' };
    default:
      return { label: type, color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', prefix: quantity >= 0 ? '+' : '' };
  }
};

const ProductHistoryMovementDetailsTab = ({
  movements,
  pagination,
  isLoadingMore,
  onLoadMore,
  formatDate,
  formatTime,
}: ProductHistoryMovementDetailsTabProps) => {
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');

  const filteredMovements = useMemo(
    () =>
      movementTypeFilter === 'all'
        ? movements
        : movements.filter((movement) => movement.type === movementTypeFilter),
    [movements, movementTypeFilter]
  );

  const activeFilterObj = movementTypeFilterOptions.find((opt) => opt.value === movementTypeFilter);
  const activeFilterLabel = activeFilterObj?.label || 'All';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
      {/* Filter Dropdown */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem' }}>
          Viewing {activeFilterLabel} Logs
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={movementTypeFilter}
            onChange={(e) => setMovementTypeFilter(e.target.value)}
            sx={{
              height: 30,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#0b1d39',
              bgcolor: '#ffffff',
              borderRadius: '6px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
              '& .MuiSelect-select': { py: 0.25, px: 1.25, display: 'flex', alignItems: 'center' },
            }}
          >
            {movementTypeFilterOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Movement Items Timeline Feed */}
      {filteredMovements.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No stock movements found for this filter.
          </Typography>
        </Box>
      ) : (
        filteredMovements.map((movement) => {
          const style = getMovementDetails(movement.type, movement.quantity);
          const bCode = batchLabel(movement.batch);

          return (
            <Paper
              key={movement.id}
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                transition: 'border-color 0.2s ease',
                '&:hover': { borderColor: '#cbd5e1' },
              }}
            >
              {/* Header: Type Chip & Date/Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Chip
                  label={style.label}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    bgcolor: style.bg,
                    color: style.color,
                    border: `1px solid ${style.border}`,
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
                  {formatDate(movement.createdAt)} {formatTime(movement.createdAt)}
                </Typography>
              </Box>

              {/* Quantity Change */}
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: style.color, fontSize: '0.88rem' }}>
                  {style.prefix}{Math.abs(movement.quantity)} units
                </Typography>
                {movement.saleId && (
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>
                    Sale #{movement.saleId}
                  </Typography>
                )}
              </Box>

              {/* Batch Code / Note */}
              {(bCode !== '—' || movement.note) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 0.25, borderTop: '1px dashed #f1f5f9' }}>
                  {bCode !== '—' && (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                      Batch: <Box component="span" sx={{ fontWeight: 600, color: '#334155' }}>{bCode}</Box>
                    </Typography>
                  )}
                  {movement.note && (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {movement.note}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          );
        })
      )}

      {/* Load More Button */}
      {pagination && pagination.page < pagination.totalPages && onLoadMore && (
        <Box sx={{ py: 1, textAlign: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            sx={{
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: '6px',
              color: '#0b1d39',
              borderColor: '#cbd5e1',
              '&:hover': { borderColor: '#0b1d39', bgcolor: 'rgba(11, 29, 57, 0.04)' },
            }}
          >
            {isLoadingMore ? <CircularProgress size={16} sx={{ mr: 1 }} /> : 'Load Older Movements'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProductHistoryMovementDetailsTab;
