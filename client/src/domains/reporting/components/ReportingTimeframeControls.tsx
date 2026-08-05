import React from 'react';
import type {
  ReportDateRange,
  ReportTimeframe,
} from '@/domains/reporting/components/useReportingData';
import { FormControl, InputLabel, Select, MenuItem, TextField, Stack, Button } from '@mui/material';

interface ReportingTimeframeControlsProps {
  /** Hidden entirely for 'low_stock', which has no time dimension. */
  reportType: string;
  /** Index into `timeframes`; 8 is the custom-range option. */
  tabValue: number;
  timeframes: ReportTimeframe[];
  dateRange: ReportDateRange;
  onTabChange: (event: { target: { value: number } }) => void;
  onDateRangeChange: (key: string, value: string) => void;
  onApplyCustomRange: () => void;
}

const ReportingTimeframeControls = ({
  reportType,
  tabValue,
  timeframes,
  dateRange,
  onTabChange,
  onDateRangeChange,
  onApplyCustomRange,
}: ReportingTimeframeControlsProps) => {
  if (reportType === 'low_stock') {
    return null;
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Time Frame</InputLabel>
        <Select value={tabValue} label="Time Frame" onChange={onTabChange}>
          {timeframes.map((tf: ReportTimeframe, idx: number) => (
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
