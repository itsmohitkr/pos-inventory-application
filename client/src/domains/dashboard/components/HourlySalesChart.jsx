import React from 'react';
import { Box, Paper, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { CATEGORY_COLORS } from '@/utils/dateUtils';

const HourlySalesChart = ({
  activeHourlyData,
  maxHourlyVal,
  startHour,
  endHour,
  metric,
  onMetricChange,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: '1 1 40%',
        p: 2,
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ color: '#0b1d39', fontWeight: 600 }}>
          Hourly Sales
        </Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value)}
            sx={{ height: 24, fontSize: '0.75rem', borderRadius: 1 }}
          >
            <MenuItem value="amount" sx={{ fontSize: '0.75rem' }}>
              Amount
            </MenuItem>
            <MenuItem value="quantity" sx={{ fontSize: '0.75rem' }}>
              Quantity
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
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
                sx={{ fontSize: '0.6rem', color: '#d1d5db', width: 30 }}
              >
                {Math.round(maxHourlyVal * tier)}
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
          }}
        >
          {activeHourlyData.slice(startHour, endHour + 1).map((val, idx) => {
            const hPct = maxHourlyVal > 0 ? (val / maxHourlyVal) * 100 : 0;
            const barColor = CATEGORY_COLORS[(idx + startHour) % CATEGORY_COLORS.length];
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
                  px: '1px',
                }}
              >
                {val > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.55rem', color: '#4b5563', mb: 0.5, zIndex: 2, mt: '-12px' }}
                  >
                    {Math.round(val)}
                  </Typography>
                )}
                {val > 0 && (
                  <Box
                    sx={{
                      width: '100%',
                      height: `${hPct}%`,
                      bgcolor: barColor,
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', ml: '30px', borderTop: '1px solid #d1d5db' }}>
        {Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour).map((h) => (
          <Box key={h} sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#64748b' }}>
              {h}:00
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ textAlign: 'center', color: '#64748b', fontSize: '0.6rem', mt: 0.5 }}
      >
        Hour of Day
      </Typography>
    </Paper>
  );
};

export default HourlySalesChart;
