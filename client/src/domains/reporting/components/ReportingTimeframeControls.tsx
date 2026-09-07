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
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
      <FormControl
        size="small"
        sx={{
          minWidth: 160,
          '& .MuiOutlinedInput-root': {
            height: '36px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
          },
        }}
      >
        <InputLabel sx={{ fontSize: '0.85rem', top: -1 }}>Time Frame</InputLabel>
        <Select value={tabValue} label="Time Frame" onChange={onTabChange}>
          {timeframes.map((tf: ReportTimeframe, idx: number) => (
            <MenuItem key={idx} value={idx} sx={{ fontSize: '0.85rem' }}>
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
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '36px',
                borderRadius: '6px',
                fontSize: '0.85rem',
              },
            }}
          />
          <TextField
            label="End Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateRange.endDate || ''}
            onChange={(e) => onDateRangeChange('endDate', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '36px',
                borderRadius: '6px',
                fontSize: '0.85rem',
              },
            }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={onApplyCustomRange}
            sx={{
              height: '36px',
              borderRadius: '6px',
              px: 1.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: '#0b1d39',
              '&:hover': { bgcolor: '#1e293b' },
            }}
          >
            Apply
          </Button>
        </>
      )}
    </Stack>
  );
};

export default React.memo(ReportingTimeframeControls);
