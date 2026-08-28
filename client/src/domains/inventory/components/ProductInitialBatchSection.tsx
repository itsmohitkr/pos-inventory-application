import type {
  AddProductFormState,
  InitialBatchForm,
} from '@/domains/inventory/components/useAddProductForm';

interface ProductInitialBatchSectionProps {
  initialBatch: InitialBatchForm;
  /** Reveals the batch-code and expiry fields when true. */
  enableBatchTracking: boolean;
  discountInput: string;
  sellingInvalid: boolean;
  fieldErrors?: Record<string, string>;
  /** Derived pricing figures, computed in useAddProductForm. */
  discountValue: number;
  discountPercent: number;
  marginValue: number;
  marginPercent: number;
  vendorDiscountValue: number;
  vendorDiscountPercent: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<AddProductFormState>>;
}

import React from 'react';
import { Box, Typography, Grid, TextField, InputAdornment, Switch, FormControlLabel, Divider, Tooltip, Paper } from '@mui/material';
import { SwapHoriz as SwapHorizIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import { getExpiryDateInputBounds } from '@/shared/utils/expiryDateBounds';
import { formatPrice } from '@/shared/utils/priceUtils';
import { inputFieldSx } from '@/domains/inventory/components/inventoryFormStyles';

const { min: expiryDateMin, max: expiryDateMax } = getExpiryDateInputBounds();

const ProductInitialBatchSection = ({
  initialBatch, enableBatchTracking, discountInput,
  sellingInvalid, fieldErrors = {}, discountValue, discountPercent, marginValue, marginPercent,
  vendorDiscountValue, vendorDiscountPercent,
  onChange, setFormData,
}: ProductInitialBatchSectionProps) => (
  <Box>
    <Typography
      variant="subtitle2"
      sx={{
        mb: 2,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: 700,
        color: 'text.secondary',
        fontSize: '0.75rem',
      }}
    >
      Lot & Batch Tracking
    </Typography>

    <Box sx={{ mb: enableBatchTracking ? 2 : 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <FormControlLabel
          control={
            <Switch
              checked={enableBatchTracking}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  enableBatchTracking: e.target.checked,
                }))
              }
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
          label={<Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>Enable Batch & Expiry Tracking</Typography>}
        />
        <Tooltip title="Enables tracking individual lot numbers and expiry dates for perishable items." arrow placement="top">
          <InfoIcon sx={{ color: '#64748b', fontSize: '1rem', cursor: 'pointer', '&:hover': { color: '#0b1d39' } }} />
        </Tooltip>
      </Box>
    </Box>

    {enableBatchTracking && (
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Batch / Lot Number"
            name="initialBatch.batch_code"
            value={initialBatch.batch_code}
            onChange={onChange}
            placeholder="e.g. BATCH-2026-A"
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Expiry Date"
            name="initialBatch.expiryDate"
            value={initialBatch.expiryDate}
            onChange={onChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: expiryDateMin, max: expiryDateMax }}
            sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
          />
        </Grid>
      </Grid>
    )}

    <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

    {/* Initial Stock & Price Info Header */}
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.85rem' }}>
        Initial Stock & Pricing
      </Typography>
    </Box>

    <Grid container spacing={2} alignItems="center">
      {/* Row 1: Initial Quantity (Single Row) */}
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Initial Quantity"
          name="initialBatch.quantity"
          value={initialBatch.quantity}
          onChange={onChange}
          required
          error={Boolean(fieldErrors['initialBatch.quantity'])}
          helperText={fieldErrors['initialBatch.quantity']}
          placeholder="0"
          InputLabelProps={{ shrink: true }}
          InputProps={{ inputProps: { min: 0, step: 1 } }}
          sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
        />
      </Grid>

      {/* Row 2: MRP & Cost Price */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="MRP"
          name="initialBatch.mrp"
          value={initialBatch.mrp}
          onChange={onChange}
          required
          error={Boolean(fieldErrors['initialBatch.mrp'])}
          helperText={fieldErrors['initialBatch.mrp']}
          placeholder="0.00"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: <InputAdornment position="start" sx={{ color: '#0b1d39', fontWeight: 700 }}>₹</InputAdornment>,
            inputProps: { min: 0, step: '0.01' },
          }}
          sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Cost Price"
          name="initialBatch.cost_price"
          value={initialBatch.cost_price}
          onChange={onChange}
          required
          error={Boolean(fieldErrors['initialBatch.cost_price'])}
          helperText={fieldErrors['initialBatch.cost_price']}
          placeholder="0.00"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: <InputAdornment position="start" sx={{ color: '#0b1d39', fontWeight: 700 }}>₹</InputAdornment>,
            inputProps: { min: 0, step: '0.01' },
          }}
          sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
        />
      </Grid>

      {/* Row 3: Discount (%) <-> Selling Price with Bi-directional Arrow */}
      <Grid size={{ xs: 12, sm: 5 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Discount (%)"
          name="initialBatch.discount_percent"
          value={discountInput}
          onChange={onChange}
          placeholder="0"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: <InputAdornment position="end" sx={{ color: '#0b1d39', fontWeight: 700 }}>%</InputAdornment>,
            inputProps: { min: 0, max: 100, step: '0.1' },
          }}
          sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SwapHorizIcon sx={{ color: '#64748b', fontSize: '1.4rem' }} />
      </Grid>

      <Grid size={{ xs: 12, sm: 5 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Selling Price"
          name="initialBatch.selling_price"
          value={initialBatch.selling_price}
          onChange={onChange}
          required
          error={Boolean(fieldErrors['initialBatch.selling_price'] || sellingInvalid)}
          helperText={
            fieldErrors['initialBatch.selling_price'] ||
            (sellingInvalid
              ? 'Selling Price must be ≥ Cost Price & ≤ MRP.'
              : discountValue > 0
                ? `Saved ₹${formatPrice(discountValue)} (${discountPercent.toFixed(1)}% off MRP)`
                : '')
          }
          placeholder="0.00"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: <InputAdornment position="start" sx={{ color: '#059669', fontWeight: 800 }}>₹</InputAdornment>,
            inputProps: { min: 0, step: '0.01' },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#ffffff',
              borderRadius: '6px',
              '& fieldset': { borderColor: sellingInvalid ? '#ef4444' : '#cbd5e1' },
              '&:hover fieldset': { borderColor: sellingInvalid ? '#ef4444' : '#94a3b8' },
              '&.Mui-focused fieldset': { borderColor: '#059669' },
            },
          }}
        />
      </Grid>

      {/* 3 Small Summary Cards for Discount, Margin, and Vendor Discount */}
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={1.5}>
          {/* Discount Small Card */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                px: 1.5,
                bgcolor: '#fff7ed',
                borderRadius: '6px',
                border: '1px solid #ffedd5',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: '#c2410c', fontSize: '0.75rem' }}
              >
                Discount
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ea580c', fontSize: '0.88rem' }}>
                  ₹{formatPrice(discountValue)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#c2410c', fontSize: '0.75rem' }}>
                  {discountPercent.toFixed(1)}%
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Margin Small Card */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                px: 1.5,
                bgcolor: marginValue >= 0 ? '#f0fdf4' : '#fef2f2',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: marginValue >= 0 ? '#bbf7d0' : '#fecaca',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: marginValue >= 0 ? '#15803d' : '#b91c1c',
                  fontSize: '0.75rem',
                }}
              >
                Margin
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: marginValue >= 0 ? '#15803d' : '#b91c1c', fontSize: '0.88rem' }}>
                  ₹{formatPrice(marginValue)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: marginValue >= 0 ? '#15803d' : '#b91c1c', fontSize: '0.75rem' }}>
                  {marginPercent.toFixed(1)}%
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Vendor Discount Small Card */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                px: 1.5,
                bgcolor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: '#0369a1', fontSize: '0.75rem' }}
              >
                Vendor Discount
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284c7', fontSize: '0.88rem' }}>
                  ₹{formatPrice(vendorDiscountValue)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1', fontSize: '0.75rem' }}>
                  {vendorDiscountPercent.toFixed(1)}%
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Box>
);

export default ProductInitialBatchSection;
