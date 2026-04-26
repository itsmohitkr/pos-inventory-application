import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, TextField, Stack, Button } from '@mui/material';

const ReportingTimeframeControls = ({
  reportType,
  tabValue,
  timeframes,
  dateRange,
  onTabChange,
  onDateRangeChange,
  onApplyCustomRange,
}) => {
  if (reportType === 'low_stock') {
    return null;
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Time Frame</InputLabel>
        <Select value={tabValue} label="Time Frame" onChange={onTabChange}>
          {timeframes.map((tf, idx) => (
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
  );
};

export default React.memo(ReportingTimeframeControls);
