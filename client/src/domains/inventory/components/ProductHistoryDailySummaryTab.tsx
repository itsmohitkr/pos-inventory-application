import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import type { StockMovementDaySummary } from '@/domains/inventory/components/inventoryTypes';

interface ProductHistoryDailySummaryTabProps {
  summaryByDate: StockMovementDaySummary[];
  formatDate: (value?: string | null) => string;
}

const ProductHistoryDailySummaryTab = ({ summaryByDate, formatDate }: ProductHistoryDailySummaryTabProps) => {
  if (summaryByDate.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No history summary for this timeframe.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
      {summaryByDate.map((row) => (
        <Paper
          key={row.date}
          elevation={0}
          sx={{
            p: 1.25,
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            transition: 'border-color 0.2s ease',
            '&:hover': { borderColor: '#cbd5e1' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.82rem' }}>
              {formatDate(row.date)}
            </Typography>
            <Chip
              label={`Net: ${row.net >= 0 ? `+${row.net}` : row.net}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 800,
                bgcolor: row.net >= 0 ? '#d1fae5' : '#fee2e2',
                color: row.net >= 0 ? '#065f46' : '#991b1b',
                border: 'none',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            <Chip
              label={`Added: +${row.added}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
            />
            <Chip
              label={`Sold: -${row.sold}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            />
            <Chip
              label={`Returned: +${row.returned}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#f0f9ff', color: '#075985', border: '1px solid #bae6fd' }}
            />
            {(row.adjustmentIn > 0 || row.adjustmentOut > 0) && (
              <Chip
                label={`Adjust: +${row.adjustmentIn} / -${row.adjustmentOut}`}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#fffbe6', color: '#873800', border: '1px solid #ffe58f' }}
              />
            )}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default ProductHistoryDailySummaryTab;
