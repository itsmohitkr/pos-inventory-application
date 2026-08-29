import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  TextField,
  type SelectChangeEvent,
} from '@mui/material';

interface ProductHistoryRangeSelectorProps {
  /** A getDateRange preset key, e.g. 'today' or 'thisMonth', or 'custom'. */
  range: string;
  onRangeChange: (range: string) => void;
  /** Only read/shown when range === 'custom'; date-input value strings (YYYY-MM-DD). */
  customStart?: string;
  customEnd?: string;
  onCustomStartChange?: (value: string) => void;
  onCustomEndChange?: (value: string) => void;
}

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

/**
 * Time-frame picker for Product History — a dropdown plus custom date
 * pickers, mirroring the same Select-based pattern SaleHistoryHeader.tsx
 * already uses for its own time-frame selector, instead of a row of toggle
 * buttons.
 */
const ProductHistoryRangeSelector = ({
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: ProductHistoryRangeSelectorProps) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <Select
        value={range}
        onChange={(event: SelectChangeEvent) => onRangeChange(event.target.value)}
        displayEmpty
        inputProps={{ 'aria-label': 'Time Frame' }}
        sx={{
          height: 30,
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#0b1d39',
          bgcolor: '#ffffff',
          borderRadius: '6px',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          '& .MuiSelect-select': { py: 0.25, px: 1.25, display: 'flex', alignItems: 'center' },
        }}
      >
        {rangeOptions.map((option) => (
          <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    {range === 'custom' && (
      <>
        <TextField
          type="date"
          size="small"
          value={customStart || ''}
          onChange={(e) => onCustomStartChange?.(e.target.value)}
          inputProps={{ 'aria-label': 'Start Date' }}
          sx={{
            width: 130,
            '& .MuiOutlinedInput-root': {
              height: 30,
              fontSize: '0.75rem',
              borderRadius: '6px',
              bgcolor: '#ffffff',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
            },
            '& input': { py: 0.25, px: 1 },
          }}
        />
        <TextField
          type="date"
          size="small"
          value={customEnd || ''}
          onChange={(e) => onCustomEndChange?.(e.target.value)}
          inputProps={{ 'aria-label': 'End Date' }}
          sx={{
            width: 130,
            '& .MuiOutlinedInput-root': {
              height: 30,
              fontSize: '0.75rem',
              borderRadius: '6px',
              bgcolor: '#ffffff',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
            },
            '& input': { py: 0.25, px: 1 },
          }}
        />
      </>
    )}
  </Box>
);

export default ProductHistoryRangeSelector;
