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
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import ProductHistoryRangeSelector from '@/domains/inventory/components/ProductHistoryRangeSelector';
import ProductHistoryDailySummaryTab from '@/domains/inventory/components/ProductHistoryDailySummaryTab';
import ProductHistoryMovementDetailsTab from '@/domains/inventory/components/ProductHistoryMovementDetailsTab';

/** DD-MM-YYYY, always — not locale-dependent, so it reads the same on every machine. */
const formatDate = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

const formatTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const [activeTab, setActiveTab] = useState(0);

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
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}
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
          <ProductHistoryRangeSelector
            range={range}
            onRangeChange={onRangeChange}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={onCustomStartChange}
            onCustomEndChange={onCustomEndChange}
          />
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

        <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                minHeight: 40,
                color: '#64748b',
                '&.Mui-selected': { color: '#0f172a' },
              },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#0f172a' },
            }}
          >
            <Tab label="Daily Summary" />
            <Tab label="Movement Details" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <ProductHistoryDailySummaryTab summaryByDate={summaryByDate} formatDate={formatDate} />
        )}

        {activeTab === 1 && (
          <ProductHistoryMovementDetailsTab
            movements={movements}
            pagination={history?.pagination}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
            productName={product?.name}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductHistoryDialog;
