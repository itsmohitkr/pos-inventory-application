import React from 'react';
import {
  Box,
  Typography,
  Stack,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import { formatDateDisplay } from '../../utils/dateUtils';

const DashboardHeader = ({
  dateRange,
  tabValue,
  timeframes,
  onTabChange,
  onStartDateChange,
  onEndDateChange,
  onApplyCustomRange,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <Typography variant="h6" sx={{ color: '#0b1d39', fontWeight: 600 }}>
        Periodic Reports ( {formatDateDisplay(dateRange.startDate)} -{' '}
        {formatDateDisplay(dateRange.endDate)} )
      </Typography>
      <CalendarIcon sx={{ color: '#0b1d39', fontSize: '1.2rem' }} />
      <Box sx={{ flex: 1, height: '1px', bgcolor: '#e2e8f0', ml: 2 }} />

      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={tabValue}
            onChange={(e) => onTabChange(e.target.value)}
            sx={{ bgcolor: '#fff', borderRadius: 1, height: 32, fontSize: '0.85rem' }}
          >
            {timeframes.map((tf, idx) => (
              <MenuItem key={idx} value={idx}>
                {tf.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {timeframes[tabValue]?.label === 'Custom' && (
          <>
            <TextField
              type="date"
              size="small"
              value={dateRange.startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              sx={{
                bgcolor: '#fff',
                '& .MuiInputBase-root': { height: 32, fontSize: '0.85rem', borderRadius: 1 },
              }}
            />
            <TextField
              type="date"
              size="small"
              value={dateRange.endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              sx={{
                bgcolor: '#fff',
                '& .MuiInputBase-root': { height: 32, fontSize: '0.85rem', borderRadius: 1 },
              }}
            />
            <Button
              variant="contained"
              onClick={onApplyCustomRange}
              sx={{
                height: 32,
                borderRadius: 1,
                bgcolor: '#0b1d39',
                '&:hover': { bgcolor: '#1e3a8a' },
                boxShadow: 'none',
              }}
            >
              GO
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default DashboardHeader;
