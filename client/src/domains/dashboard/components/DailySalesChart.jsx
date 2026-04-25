import React from 'react';
import { Box, Paper, Typography, IconButton, CircularProgress } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { FULL_MONTHS, CATEGORY_COLORS, formatShortNum } from '@/utils/dateUtils';

const DailySalesChart = ({
  data,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onSync,
  loading,
  maxVal,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ color: '#0b1d39', fontWeight: 600, letterSpacing: '-0.5px' }}
          >
            Daily Sales
          </Typography>
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            Sales data grouped by day
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, color: '#6b7280', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={onPrevMonth} sx={{ color: '#64748b' }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="subtitle2"
              sx={{ color: '#0b1d39', fontWeight: 600, minWidth: '100px', textAlign: 'center' }}
            >
              {FULL_MONTHS[month]} {year}
            </Typography>
            <IconButton size="small" onClick={onNextMonth} sx={{ color: '#64748b' }}>
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
          height: 160,
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
            <Box
              key={`daily-tier-${tier}`}
              sx={{ display: 'flex', alignItems: 'center', width: '100%' }}
            >
              <Typography
                variant="caption"
                sx={{ fontSize: '0.6rem', color: '#9ca3af', width: 30 }}
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
            ml: '30px',
            flex: 1,
            zIndex: 1,
            height: '100%',
            alignItems: 'flex-end',
            gap: 0.5,
          }}
        >
          {data.map((item, idx) => {
            const hPct = maxVal > 0 ? (item.totalSales / maxVal) * 100 : 0;
            return (
              <Box
                key={`daily-bar-${idx}`}
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
                    sx={{
                      fontSize: '0.55rem',
                      color: '#4b5563',
                      mb: 0.5,
                      zIndex: 2,
                      mt: '-15px',
                      whiteSpace: 'nowrap',
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'left bottom',
                    }}
                  >
                    {formatShortNum(item.totalSales)}
                  </Typography>
                )}
                <Box
                  sx={{
                    width: '100%',
                    height: `${hPct}%`,
                    bgcolor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                    borderRight: '1px solid #fff',
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    transition: 'height 0.3s ease',
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', ml: '30px', borderTop: '1px solid #d1d5db', mt: 0.5 }}>
        {data.map((item, idx) => (
          <Typography
            key={`daily-label-${idx}`}
            variant="caption"
            sx={{ flex: 1, textAlign: 'center', fontSize: '0.55rem', color: '#4b5563', mt: 0.5 }}
          >
            {item.day}
          </Typography>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ textAlign: 'center', color: '#6b7280', fontSize: '0.6rem', mt: 0.5 }}
      >
        Day of Month
      </Typography>
    </Paper>
  );
};

export default DailySalesChart;
