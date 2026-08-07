import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';

/** One selectable range in the timeframe dropdown. */
export interface SaleHistoryTimeframe {
  label: string;
  /** Null for the 'Custom' entry, which is driven by the date pickers. */
  getValue: () => { start: string; end: string } | null;
}

export interface SaleHistoryDateRange {
  startDate: string;
  endDate: string;
}

interface SaleHistoryHeaderProps {
  /** Index into `timeframes`; the last entry is the custom range. */
  tabValue: number;
  onTabChange: (event: { target: { value: number } }) => void;
  timeframes: SaleHistoryTimeframe[];
  dateRange: SaleHistoryDateRange;
  onDateRangeChange: (key: string, value: string) => void;
  onApplyCustomRange: () => void;
}

const SaleHistoryHeader = ({
  tabValue,
  onTabChange,
  timeframes,
  dateRange,
  onDateRangeChange,
  onApplyCustomRange,
}: SaleHistoryHeaderProps) => (
  <Paper
    elevation={0}
    className="no-print"
    sx={{
      m: 1.5,
      px: 2.5,
      py: 1.75,
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>
          Sale History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage past transactions and receipts.
        </Typography>
      </Box>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Frame</InputLabel>
          <Select value={tabValue} label="Time Frame" onChange={onTabChange}>
            {timeframes.map((tf: SaleHistoryTimeframe, idx: number) => (
              <MenuItem key={idx} value={idx}>
                {tf.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {tabValue === 8 && (
          <>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRange.startDate || ''}
              onChange={(e) => onDateRangeChange('startDate', e.target.value)}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRange.endDate || ''}
              onChange={(e) => onDateRangeChange('endDate', e.target.value)}
            />
            <Button variant="outlined" onClick={onApplyCustomRange} sx={{ height: 40 }}>
              Apply
            </Button>
          </>
        )}
      </Stack>
    </Box>
  </Paper>
);

export default SaleHistoryHeader;
