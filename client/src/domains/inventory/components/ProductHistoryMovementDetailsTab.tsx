import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
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

/**
 * Batch tracking is often off, so most movements' batch has no code — fall
 * back to the batch's price so the cell still carries information instead
 * of a bare "N/A"; only a genuinely missing batch shows an em dash.
 */
const batchLabel = (batch?: { batchCode?: string | null; sellingPrice?: number | null } | null): string => {
  if (!batch) return '—';
  if (batch.batchCode) return batch.batchCode;
  if (batch.sellingPrice != null) return `₹${batch.sellingPrice.toFixed(2)}`;
  return 'N/A';
};

const movementColor = (type: string) => {
  switch (type) {
    case 'added':
      return 'success';
    case 'sold':
      return 'error';
    case 'returned':
      return 'info';
    case 'adjustment_in':
      return 'warning';
    case 'adjustment_out':
      return 'warning';
    default:
      return 'default';
  }
};

const movementLabel = (type: string): string => {
  switch (type) {
    case 'added':
      return 'Added';
    case 'sold':
      return 'Sold';
    case 'returned':
      return 'Returned';
    case 'adjustment_in':
      return 'Adjust +';
    case 'adjustment_out':
      return 'Adjust -';
    default:
      return type;
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
  const filteredMovements =
    movementTypeFilter === 'all'
      ? movements
      : movements.filter((movement) => movement.type === movementTypeFilter);

  return (
    <>
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={movementTypeFilter}
          onChange={(_event, value) => {
            if (value) setMovementTypeFilter(value);
          }}
        >
          {movementTypeFilterOptions.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>Batch</TableCell>
            <TableCell>Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredMovements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary">
                  {movements.length === 0 ? 'No movements found' : 'No movements match this filter'}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{formatDate(movement.createdAt)}</TableCell>
                <TableCell>{formatTime(movement.createdAt)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={movementLabel(movement.type)}
                    color={movementColor(movement.type)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{movement.quantity}</TableCell>
                <TableCell>{batchLabel(movement.batch)}</TableCell>
                <TableCell>
                  {movement.saleId && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Sale #${movement.saleId}`}
                      sx={{ mr: 0.75, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                  {movement.note || '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {movements.length} of {pagination.totalCount}
          </Typography>
          {pagination.page < pagination.totalPages && (
            <Button size="small" variant="outlined" disabled={isLoadingMore} onClick={onLoadMore}>
              {isLoadingMore ? 'Loading…' : 'Load More'}
            </Button>
          )}
        </Box>
      )}
    </>
  );
};

export default ProductHistoryMovementDetailsTab;
