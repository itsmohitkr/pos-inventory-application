import type { Product } from '@/shared/types/models';
import type { ProductHistory } from '@/domains/inventory/components/inventoryTypes';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Paper,
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

interface ProductHistoryPanelContentProps {
  product?: Product | null;
  history?: ProductHistory | null;
  loading: boolean;
  error?: string | null;
  range: string;
  onRangeChange: (range: string) => void;
  customStart?: string;
  customEnd?: string;
  onCustomStartChange?: (value: string) => void;
  onCustomEndChange?: (value: string) => void;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const ProductHistoryPanelContent = ({
  history,
  loading,
  error,
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  isLoadingMore,
  onLoadMore,
}: ProductHistoryPanelContentProps) => {
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

  const [activeSubTab, setActiveSubTab] = useState(0);

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.25, overflowY: 'auto' }}>
      {/* Time Frame Selector Card */}
      <Paper
        elevation={0}
        sx={{
          p: 1.25,
          px: 1.5,
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'nowrap' }}>
          {/* Left Side: Time Frame Header & Date Range Subtitle */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem' }}>
              Time Frame
            </Typography>
            {history?.startDate && history?.endDate && (
              <Typography variant="caption" sx={{ color: '#0b1d39', fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                {formatDate(history.startDate)} – {formatDate(history.endDate)}
              </Typography>
            )}
          </Box>

          {/* Right Side: Range Dropdown Selector */}
          <Box sx={{ flexShrink: 0 }}>
            <ProductHistoryRangeSelector
              range={range}
              onRangeChange={onRangeChange}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={onCustomStartChange}
              onCustomEndChange={onCustomEndChange}
            />
          </Box>
        </Box>
      </Paper>

      {/* Progress & Error indicators */}
      {loading && <LinearProgress sx={{ height: 3, borderRadius: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ py: 0.5, fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}

      {/* Sub-Tabs for Audit Statistics, Daily Summary & Movement Details */}
      <Paper elevation={0} sx={{ borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', p: 1, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 1 }}>
          <Tabs
            value={activeSubTab}
            onChange={(_event, value) => setActiveSubTab(value)}
            sx={{
              minHeight: 34,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                minHeight: 34,
                py: 0.25,
                px: 1.25,
                color: '#64748b',
                '&.Mui-selected': { color: '#0b1d39' },
              },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#0b1d39' },
            }}
          >
            <Tab label="Audit Statistics" />
            <Tab label={`Daily Summary (${summaryByDate.length})`} />
            <Tab label={`Movement Details (${movements.length})`} />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {/* Tab 1: Audit Statistics */}
          {activeSubTab === 0 && (
            <Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.82rem' }}>
                Audit Totals Summary
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1,
                }}
              >
                <Paper elevation={0} sx={{ p: 1.25, px: 1.5, textAlign: 'center', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, fontSize: '0.72rem', display: 'block', mb: 0.25 }}>
                    Added
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#15803d', fontSize: '1.05rem' }}>
                    +{totals.added}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.25, px: 1.5, textAlign: 'center', bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, fontSize: '0.72rem', display: 'block', mb: 0.25 }}>
                    Sold
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#b91c1c', fontSize: '1.05rem' }}>
                    -{totals.sold}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.25, px: 1.5, textAlign: 'center', bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#075985', fontWeight: 600, fontSize: '0.72rem', display: 'block', mb: 0.25 }}>
                    Returned
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.05rem' }}>
                    +{totals.returned}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.25, px: 1.5, textAlign: 'center', bgcolor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#873800', fontWeight: 600, fontSize: '0.72rem', display: 'block', mb: 0.25 }}>
                    Adjust +
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#d46b08', fontSize: '1.05rem' }}>
                    +{totals.adjustmentIn}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.25, px: 1.5, textAlign: 'center', bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#6b21a8', fontWeight: 600, fontSize: '0.72rem', display: 'block', mb: 0.25 }}>
                    Adjust -
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#7e22ce', fontSize: '1.05rem' }}>
                    -{totals.adjustmentOut}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    textAlign: 'center',
                    bgcolor: totals.net >= 0 ? '#059669' : '#dc2626',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem', display: 'block', opacity: 0.9, mb: 0.25 }}>
                    Net Change
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    {totals.net >= 0 ? `+${totals.net}` : totals.net}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}

          {/* Tab 2: Daily Summary */}
          {activeSubTab === 1 && (
            <ProductHistoryDailySummaryTab summaryByDate={summaryByDate} formatDate={formatDate} />
          )}

          {/* Tab 3: Movement Details */}
          {activeSubTab === 2 && (
            <ProductHistoryMovementDetailsTab
              movements={movements}
              pagination={history?.pagination}
              isLoadingMore={isLoadingMore}
              onLoadMore={onLoadMore}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProductHistoryPanelContent;
