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
import { ShoppingBag as PosIcon, Sell as LooseIcon } from '@mui/icons-material';

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
