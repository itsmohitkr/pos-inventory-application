import type { Product } from '@/shared/types/models';
import type { ProductHistory } from '@/domains/inventory/components/inventoryTypes';

interface ProductHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  /** Null while the range is still loading. */
  history?: ProductHistory | null;
  /** Set when the last fetch failed — takes precedence over the empty-state text. */
  error?: string | null;
  loading: boolean;
  /** A getDateRange preset key, e.g. 'today' or 'thisMonth', or 'custom'. */
  range: string;
  onRangeChange: (range: string) => void;
  /** Only read/shown when range === 'custom'; date-input value strings (YYYY-MM-DD). */
  customStart?: string;
  customEnd?: string;
  onCustomStartChange?: (value: string) => void;
  onCustomEndChange?: (value: string) => void;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  ButtonGroup,
  Divider,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

const movementTypeFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'added', label: 'Added' },
  { value: 'sold', label: 'Sold' },
  { value: 'returned', label: 'Returned' },
  { value: 'adjustment_in', label: 'Adjust +' },
  { value: 'adjustment_out', label: 'Adjust -' },
];

const rangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'custom', label: 'Custom' },
];

const formatDate = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString();
};

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

const formatTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

const ProductHistoryDialog = ({
  open,
  onClose,
  product,
  history,
  error,
  loading,
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  isLoadingMore,
  onLoadMore,
}: ProductHistoryDialogProps) => {
  const totals = history?.totals || {
    added: 0,
    sold: 0,
    returned: 0,
    adjustmentIn: 0,
    adjustmentOut: 0,
    net: 0,
  };
  const summaryByDate = history?.summaryByDate || [];
  const movements = history?.movements || [];

  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const filteredMovements =
    movementTypeFilter === 'all'
      ? movements
      : movements.filter((movement) => movement.type === movementTypeFilter);

  const totalCount = history?.pagination?.totalCount ?? movements.length;
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
    const productLabel = (product?.name || 'product').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    link.download = `${productLabel}_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: '75vh' } }}
      onKeyDown={(event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
        if ((event.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
        event.preventDefault();
        onClose();
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
          >
            <Box>
              <Typography variant="h6">Product History</Typography>
              <Typography variant="body2" color="text.secondary">
                {product?.name || ''}
              </Typography>
              {history?.startDate && history?.endDate && (
                <Typography variant="caption" color="text.secondary">
                  {formatDate(history.startDate)} – {formatDate(history.endDate)}
                </Typography>
              )}
            </Box>
            <ButtonGroup size="small" variant="outlined">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => onRangeChange(option.value)}
                  variant={range === option.value ? 'contained' : 'outlined'}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          {range === 'custom' && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <TextField
                type="date"
                size="small"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={customStart || ''}
                onChange={(e) => onCustomStartChange?.(e.target.value)}
              />
              <TextField
                type="date"
                size="small"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={customEnd || ''}
                onChange={(e) => onCustomEndChange?.(e.target.value)}
              />
            </Box>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <Chip label={`Added: ${totals.added}`} color="success" variant="outlined" />
          <Chip label={`Sold: ${totals.sold}`} color="error" variant="outlined" />
          <Chip label={`Returned: ${totals.returned}`} color="info" variant="outlined" />
          <Chip label={`Adjust +: ${totals.adjustmentIn}`} color="warning" variant="outlined" />
          <Chip label={`Adjust -: ${totals.adjustmentOut}`} color="warning" variant="outlined" />
          <Chip
            label={`Net: ${totals.net}`}
            color={totals.net >= 0 ? 'success' : 'error'}
            variant="filled"
          />
        </Box>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Daily Summary
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Added</TableCell>
              <TableCell align="right">Sold</TableCell>
              <TableCell align="right">Returned</TableCell>
              <TableCell align="right">Adjust +</TableCell>
              <TableCell align="right">Adjust -</TableCell>
              <TableCell align="right">Net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryByDate.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No history for this range
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              summaryByDate.map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell align="right">{row.added}</TableCell>
                  <TableCell align="right">{row.sold}</TableCell>
                  <TableCell align="right">{row.returned}</TableCell>
                  <TableCell align="right">{row.adjustmentIn}</TableCell>
                  <TableCell align="right">{row.adjustmentOut}</TableCell>
                  <TableCell align="right">{row.net}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Movement Details
          </Typography>
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
            <Button
              size="small"
              variant="outlined"
              onClick={handleExportCsv}
              disabled={filteredMovements.length === 0}
            >
              {exportLabel}
            </Button>
          </Box>
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
        {history?.pagination && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {movements.length} of {history.pagination.totalCount}
            </Typography>
            {history.pagination.page < history.pagination.totalPages && (
              <Button size="small" variant="outlined" disabled={isLoadingMore} onClick={onLoadMore}>
                {isLoadingMore ? 'Loading…' : 'Load More'}
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductHistoryDialog;
