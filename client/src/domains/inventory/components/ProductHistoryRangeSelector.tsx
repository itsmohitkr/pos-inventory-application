import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
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
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Time Frame</InputLabel>
      <Select
        value={range}
        label="Time Frame"
        onChange={(event: SelectChangeEvent) => onRangeChange(event.target.value)}
      >
        {rangeOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
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
          label="From"
          InputLabelProps={{ shrink: true }}
          value={customStart || ''}
          onChange={(e) => onCustomStartChange?.(e.target.value)}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          InputLabelProps={{ shrink: true }}
          value={customEnd || ''}
          onChange={(e) => onCustomEndChange?.(e.target.value)}
        />
      </>
    )}
  </Box>
);

export default ProductHistoryRangeSelector;
