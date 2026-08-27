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
  /** Used to name the exported CSV file. */
  productName?: string;
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

/** Quotes a CSV field and doubles any embedded quotes, per RFC 4180. */
const escapeCsvField = (value: string | number): string => `"${String(value).replace(/"/g, '""')}"`;

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
  productName,
  formatDate,
  formatTime,
}: ProductHistoryMovementDetailsTabProps) => {
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const filteredMovements =
    movementTypeFilter === 'all'
      ? movements
      : movements.filter((movement) => movement.type === movementTypeFilter);

  const totalCount = pagination?.totalCount ?? movements.length;
  const exportLabel =
    filteredMovements.length < totalCount
      ? `Export Loaded (${filteredMovements.length} of ${totalCount})`
      : 'Export CSV';

  const handleExportCsv = () => {
    const headers = ['Date', 'Time', 'Type', 'Qty', 'Batch', 'Sale #', 'Note'];
    const rows = filteredMovements.map((movement) => [
      escapeCsvField(formatDate(movement.createdAt)),
      escapeCsvField(formatTime(movement.createdAt)),
      escapeCsvField(movementLabel(movement.type)),
      movement.quantity,
      escapeCsvField(batchLabel(movement.batch)),
      movement.saleId ?? '',
      escapeCsvField(movement.note || ''),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const productLabel = (productName || 'product').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    link.download = `${productLabel}_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
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
        <Button
          size="small"
          variant="outlined"
          onClick={handleExportCsv}
          disabled={filteredMovements.length === 0}
        >
          {exportLabel}
        </Button>
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
