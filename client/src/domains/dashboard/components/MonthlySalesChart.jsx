import React from 'react';
import { Box, Paper, Typography, IconButton, CircularProgress, Tooltip } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { MONTHS, CATEGORY_COLORS, formatShortNum } from '@/utils/dateUtils';

const MonthlySalesChart = ({ data, year, onPrevYear, onNextYear, onSync, loading, maxVal }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 2,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ color: '#0b1d39', fontWeight: 600, letterSpacing: '-0.5px' }}
          >
            Monthly Sales
          </Typography>
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            Sales data grouped by month
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, color: '#6b7280', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={onPrevYear} sx={{ color: '#64748b' }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="subtitle2"
              sx={{ color: '#0b1d39', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}
            >
              {year}
            </Typography>
            <IconButton size="small" onClick={onNextYear} sx={{ color: '#64748b' }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
          {loading ? (
            <CircularProgress size={18} sx={{ ml: 1, color: '#6b7280' }} />
          ) : (
            <SyncIcon fontSize="small" sx={{ cursor: 'pointer', ml: 1 }} onClick={onSync} />
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 'auto',
          display: 'flex',
          alignItems: 'flex-end',
          height: 140,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 20,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {[1, 0.8, 0.6, 0.4, 0.2, 0].map((tier) => (
            <Box key={tier} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.6rem', color: '#9ca3af', width: 40 }}
              >
                {formatShortNum(maxVal * tier)}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: tier === 0 ? '#d1d5db' : '#f3f4f6' }} />
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            ml: '40px',
            flex: 1,
            zIndex: 1,
            height: '100%',
            alignItems: 'flex-end',
          }}
        >
          {data.map((item, idx) => {
            const hPct = maxVal > 0 ? (item.totalSales / maxVal) * 100 : 0;
            return (
              <Box
                key={idx}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                {item.totalSales > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.6rem', color: '#4b5563', mb: 0.5, zIndex: 2, mt: '-15px' }}
                  >
                    {formatShortNum(item.totalSales)}
                  </Typography>
                )}
                <Tooltip title={`₹${item.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} arrow>
                  <Box
                    sx={{
                      width: '100%',
                      height: `${hPct}%`,
                      bgcolor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      borderRight: '1px solid #fff',
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                      transition: 'height 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', ml: '40px', borderTop: '1px solid #d1d5db' }}>
        {MONTHS.map((m) => (
          <Typography
            key={m}
            variant="caption"
            sx={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: '#4b5563', mt: 0.5 }}
          >
            {m}
          </Typography>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ textAlign: 'center', color: '#6b7280', fontSize: '0.6rem', mt: 1 }}
      >
        Month
      </Typography>
    </Paper>
  );
};

export default MonthlySalesChart;
