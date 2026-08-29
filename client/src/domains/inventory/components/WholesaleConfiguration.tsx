import React from 'react';
import { limitTwoDecimals, formatPrice } from '@/shared/utils/priceUtils';
import {
  Grid,
  TextField,
  InputAdornment,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  Paper,
} from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { inputFieldSx } from '@/domains/inventory/components/inventoryFormStyles';
import { blurNumberInputOnWheel } from '@/shared/utils/numberInputScroll';

/**
 * Price/qty props accept strings because callers pass raw form state; the
 * component coerces with Number() internally.
 */
interface WholesaleConfigurationProps {
  wholesaleEnabled?: boolean;
  onToggleChange: (enabled: boolean) => void;
  wholesalePrice?: number | string;
  onPriceChange: (value: string) => void;
  wholesaleMinQty?: number | string;
  onMinQtyChange: (value: string) => void;
  sellingPrice?: number | string;
  costPrice?: number | string;
  fieldErrors?: Record<string, string>;
  showErrors?: boolean;
}

const WholesaleConfiguration = ({
  wholesaleEnabled,
  onToggleChange,
  wholesalePrice,
  onPriceChange,
  wholesaleMinQty,
  onMinQtyChange,
  sellingPrice = 0,
  costPrice = 0,
  fieldErrors = {},
  showErrors = false,
}: WholesaleConfigurationProps) => {
  const sPrice = Number(sellingPrice) || 0;
  const cPrice = Number(costPrice) || 0;
  const wPrice = Number(wholesalePrice) || 0;

  const wholesaleSavings = sPrice > 0 ? sPrice - wPrice : 0;
  const wholesalePricePercent = sPrice > 0 ? (wholesaleSavings / sPrice) * 100 : 0;
  const wholesaleMarginValue = wPrice - cPrice;
  const wholesaleMarginPercent = wPrice > 0 ? (wholesaleMarginValue / wPrice) * 100 : 0;

  const wPriceError = fieldErrors['initialBatch.wholesalePrice'] || (showErrors && (!wholesalePrice || wholesalePrice.toString().trim() === '') ? 'Required' : '');
  const wQtyError = fieldErrors['initialBatch.wholesaleMinQty'] || (showErrors && (!wholesaleMinQty || wholesaleMinQty.toString().trim() === '') ? 'Required' : '');

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: wholesaleEnabled ? 1.5 : 0 }}>
        <FormControlLabel
          control={
            <Switch
              checked={wholesaleEnabled}
              onChange={(e) => onToggleChange(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#0b1d39',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#0b1d39',
                },
              }}
            />
          }
          label={
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
              Enable Wholesale Pricing
            </Typography>
          }
        />
        <Tooltip title="Enable this to set special discounted prices for bulk orders." arrow placement="top">
          <InfoIcon sx={{ color: '#64748b', fontSize: '1rem', cursor: 'pointer', '&:hover': { color: '#0b1d39' } }} />
        </Tooltip>
      </Box>

      {wholesaleEnabled && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              size="small"
              label="Wholesale Price"
              required
              InputLabelProps={{ shrink: true }}
              value={wholesalePrice}
              onChange={(e) => onPriceChange(limitTwoDecimals(e.target.value))}
              placeholder="0.00"
              error={Boolean(wPriceError)}
              helperText={wPriceError}
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ color: '#0b1d39', fontWeight: 700 }}>₹</InputAdornment>,
                inputProps: { min: 0, step: '0.01', onWheel: blurNumberInputOnWheel },
              }}
              sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              size="small"
              label="Min. Quantity"
              required
              InputLabelProps={{ shrink: true }}
              value={wholesaleMinQty}
              onChange={(e) => onMinQtyChange(e.target.value)}
              placeholder="10"
              error={Boolean(wQtyError)}
              helperText={wQtyError}
              InputProps={{ inputProps: { min: 1, step: 1, onWheel: blurNumberInputOnWheel } }}
              sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
            />
          </Grid>

          {/* Small Summary Cards for Wholesale Savings and Wholesale Margin */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={1.5}>
              {/* Savings vs Retail Small Card */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0.75,
                    px: 1,
                    bgcolor: '#f5f3ff',
                    borderRadius: '5px',
                    border: '1px solid #ede9fe',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.15,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: '#6d28d9', fontSize: '0.68rem', textTransform: 'none' }}
                  >
                    Savings vs Retail
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.25 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.78rem' }}>
                      ₹{formatPrice(wholesaleSavings)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#6d28d9', fontSize: '0.68rem' }}>
                      {wholesalePricePercent.toFixed(1)}% less
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Wholesale Margin Small Card */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0.75,
                    px: 1,
                    bgcolor: wholesaleMarginPercent >= 0 ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: wholesaleMarginPercent >= 0 ? '#bbf7d0' : '#fecaca',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.15,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: wholesaleMarginPercent >= 0 ? '#15803d' : '#b91c1c',
                      fontSize: '0.68rem',
                      textTransform: 'none',
                    }}
                  >
                    Wholesale Margin
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.25 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: wholesaleMarginPercent >= 0 ? '#15803d' : '#b91c1c', fontSize: '0.78rem' }}>
                      ₹{formatPrice(wholesaleMarginValue)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: wholesaleMarginPercent >= 0 ? '#15803d' : '#b91c1c', fontSize: '0.68rem' }}>
                      {wholesaleMarginPercent.toFixed(1)}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default WholesaleConfiguration;
