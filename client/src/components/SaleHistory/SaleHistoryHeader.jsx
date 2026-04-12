import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import {
  ShoppingBag as PosIcon,
  Sell as LooseIcon,
} from '@mui/icons-material';

const SaleHistoryHeader = ({
  saleType,
  onSaleTypeChange,
  tabValue,
  onTabChange,
  timeframes,
  dateRange,
  onDateRangeChange,
  onApplyCustomRange,
}) => (
  <Paper
    elevation={0}
    className="no-print"
    sx={{
      m: 3,
      px: 4,
      py: 2.5,
      background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)',
      borderBottom: '1px solid rgba(16, 24, 40, 0.08)',
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
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}
        >
          Sale History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage past transactions and receipts.
        </Typography>
      </Box>
      <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
        <ToggleButtonGroup
          value={saleType}
          exclusive
          onChange={onSaleTypeChange}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}
        >
          <ToggleButton value="pos" sx={{ px: 2, gap: 1, fontWeight: 700 }}>
            <PosIcon fontSize="small" />
            POS Sales
          </ToggleButton>
          <ToggleButton value="loose" sx={{ px: 2, gap: 1, fontWeight: 700 }}>
            <LooseIcon fontSize="small" />
            Loose Sales
          </ToggleButton>
        </ToggleButtonGroup>

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
    </Box>
  </Paper>
);

export default SaleHistoryHeader;
