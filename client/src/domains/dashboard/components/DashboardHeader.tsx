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
import { formatDateDisplay } from '@/utils/dateUtils';

export interface DateRangeState {
  startDate: string;
  endDate: string;
}

export interface Timeframe {
  label: string;
  /** Key passed to getDateRange, e.g. 'today' | 'thisMonth' | 'custom'. */
  type: string;
}

interface DashboardHeaderProps {
  dateRange: DateRangeState;
  /** Index into `timeframes` — the Select's MenuItem values are indices. */
  tabValue: number;
  timeframes: Timeframe[];
  onTabChange: (value: number) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApplyCustomRange: () => void;
}

const DashboardHeader = ({
  dateRange,
  tabValue,
  timeframes,
  onTabChange,
  onStartDateChange,
  onEndDateChange,
  onApplyCustomRange,
}: DashboardHeaderProps) => {
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
          <Select<number>
            value={tabValue}
            onChange={(e) => onTabChange(e.target.value as number)}
            sx={{ bgcolor: '#fff', height: 34 }}
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
                '& .MuiInputBase-root': { height: 34 },
              }}
            />
            <TextField
              type="date"
              size="small"
              value={dateRange.endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              sx={{
                bgcolor: '#fff',
                '& .MuiInputBase-root': { height: 34 },
              }}
            />
            <Button
              variant="contained"
              onClick={onApplyCustomRange}
              sx={{
                height: 34,
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
