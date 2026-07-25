import React from 'react';
import { Box, Typography, Grid, TextField, InputAdornment, Switch, FormControlLabel, Divider } from '@mui/material';
import { SwapHoriz as SwapHorizIcon } from '@mui/icons-material';

const ProductInitialBatchSection = ({
  initialBatch, enableBatchTracking, discountInput,
  sellingInvalid, discountValue, discountPercent, marginValue, marginPercent,
  vendorDiscountValue, vendorDiscountPercent,
  onChange, setFormData,
}) => (
  <Box>
    {/* Inventory Tracking */}
    <Typography variant="subtitle2" color="primary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
      Inventory Tracking
    </Typography>
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <FormControlLabel
          control={<Switch checked={enableBatchTracking} onChange={(e) => setFormData((prev) => ({ ...prev, enableBatchTracking: e.target.checked }))} />}
          label={<Typography fontWeight={500}>Enable batch tracking</Typography>}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0 }}>
          Turn this on only if you want batch-level stock tracking for this product.
        </Typography>
      </Grid>
      
      {enableBatchTracking && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Batch Code" name="initialBatch.batch_code" value={initialBatch.batch_code} onChange={onChange} placeholder="e.g. B001 (leave empty to auto-generate)" InputLabelProps={{ shrink: true }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Leave empty to auto-generate a unique batch code</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" type="date" label="Expiry Date" name="initialBatch.expiryDate" value={initialBatch.expiryDate} onChange={onChange} InputLabelProps={{ shrink: true }} />
          </Grid>
        </>
      )}

      <Grid size={{ xs: 12, sm: enableBatchTracking ? 12 : 6 }}>
        <TextField fullWidth size="small" type="number" label="Quantity" name="initialBatch.quantity" value={initialBatch.quantity} onChange={onChange} placeholder="0" InputLabelProps={{ shrink: true }} InputProps={{ inputProps: { min: 0, step: 1 } }} />
      </Grid>
    </Grid>

    <Divider sx={{ my: 4 }} />

    {/* Pricing Details */}
    <Typography variant="subtitle2" color="primary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
      Pricing Details
    </Typography>
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size="small" type="number" label="MRP" name="initialBatch.mrp" value={initialBatch.mrp} onChange={onChange} placeholder="0.00" InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: '0.01' } }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size="small" type="number" label="Cost Price" name="initialBatch.cost_price" value={initialBatch.cost_price} onChange={onChange} placeholder="0.00" InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: '0.01' } }} />
      </Grid>

      <Grid size={{ xs: 12, sm: 5 }}>
        <TextField fullWidth size="small" label="Discount (%)" name="initialBatch.discount_percent" InputLabelProps={{ shrink: true }} value={discountInput} onChange={onChange} placeholder="0.0" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SwapHorizIcon color="action" />
      </Grid>
      <Grid size={{ xs: 12, sm: 5 }}>
        <TextField fullWidth size="small" type="number" label="Selling Price" name="initialBatch.selling_price" InputLabelProps={{ shrink: true }} value={initialBatch.selling_price} onChange={onChange} error={sellingInvalid} helperText={sellingInvalid ? 'Must be ≤ MRP & ≥ Cost' : ' '} placeholder="0.00" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: '0.01' } }} />
      </Grid>

      {/* Pricing summary strip */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ p: 2, bgcolor: 'rgba(2, 132, 199, 0.04)', borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 3, border: '1px dashed rgba(2, 132, 199, 0.2)' }}>
          {[
            { label: 'Discount', value: `₹${discountValue.toFixed(2)} (${discountPercent.toFixed(1)}%)`, color: '#0284c7' },
            { label: 'Margin', value: `₹${marginValue.toFixed(2)} (${marginPercent.toFixed(1)}%)`, color: '#16a34a' },
            { label: 'Vendor Discount', value: `₹${vendorDiscountValue.toFixed(2)} (${vendorDiscountPercent.toFixed(1)}%)`, color: '#475569' },
          ].map(({ label, value, color }) => (
            <Box key={label}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                {label}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Grid>
    </Grid>
  </Box>
);

export default ProductInitialBatchSection;
