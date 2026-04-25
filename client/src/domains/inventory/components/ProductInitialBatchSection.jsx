import React from 'react';
import { Box, Typography, Grid, TextField, InputAdornment } from '@mui/material';
import { Numbers as NumbersIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import WholesaleConfiguration from '@/domains/inventory/components/WholesaleConfiguration';

const ProductInitialBatchSection = ({
  initialBatch, enableBatchTracking, discountInput,
  sellingInvalid, discountValue, discountPercent, marginValue, marginPercent,
  vendorDiscountValue, vendorDiscountPercent,
  onChange, setFormData,
}) => (
  <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <NumbersIcon color="secondary" />
      <Typography variant="subtitle1" fontWeight={600}>Initial Stock & Pricing</Typography>
    </Box>
    <Grid container spacing={2}>
      {enableBatchTracking && (
        <>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Batch Code" name="initialBatch.batch_code" value={initialBatch.batch_code} onChange={onChange} placeholder="e.g. B001 (leave empty to auto-generate)" InputLabelProps={{ shrink: true }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Leave empty to auto-generate a unique batch code</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth type="date" label="Expiry Date" name="initialBatch.expiryDate" value={initialBatch.expiryDate} onChange={onChange} InputLabelProps={{ shrink: true }} />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField fullWidth type="number" label="Quantity" name="initialBatch.quantity" value={initialBatch.quantity} onChange={onChange} placeholder="0" InputLabelProps={{ shrink: true }} InputProps={{ inputProps: { min: 0, step: 1 } }} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField fullWidth type="number" label="MRP" name="initialBatch.mrp" value={initialBatch.mrp} onChange={onChange} placeholder="0.00" InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: '0.01' } }} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth type="number" label="Cost Price" name="initialBatch.cost_price" value={initialBatch.cost_price} onChange={onChange} placeholder="0.00" InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: '0.01' } }} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth label="Discount (%)" name="initialBatch.discount_percent" InputLabelProps={{ shrink: true }} value={discountInput} onChange={onChange} placeholder="0.0" InputProps={{ startAdornment: <InputAdornment position="start">%</InputAdornment> }} />
      </Grid>
      <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ArrowForwardIcon color="action" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth type="number" label="Selling Price" name="initialBatch.selling_price" InputLabelProps={{ shrink: true }} value={initialBatch.selling_price} onChange={onChange} error={sellingInvalid} helperText={sellingInvalid ? 'Must be ≤ MRP & ≥ Cost' : ' '} placeholder="0.00" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: '0.01' } }} />
      </Grid>

      {/* Pricing summary strip */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 1, display: 'flex', flexWrap: 'wrap', gap: 3, border: '1px solid #e0f2fe' }}>
          {[
            { label: 'Discount', value: `₹${discountValue.toFixed(2)} (${discountPercent.toFixed(1)}%)`, color: '#ed6c02' },
            { label: 'Margin', value: `₹${marginValue.toFixed(2)} (${marginPercent.toFixed(1)}%)`, color: '#2e7d32' },
            { label: 'Vendor Discount', value: `₹${vendorDiscountValue.toFixed(2)} (${vendorDiscountPercent.toFixed(1)}%)`, color: '#0288d1' },
          ].map(({ label, value, color }) => (
            <Typography key={label} variant="caption" sx={{ fontWeight: 600, color, display: 'flex', alignItems: 'center' }}>
              {label}:{' '}
              <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color }}>{value}</Box>
            </Typography>
          ))}
        </Box>
      </Grid>

      <Grid size={{ xs: 12 }}><Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', my: 2 }} /></Grid>

      <Grid size={{ xs: 12 }}>
        <WholesaleConfiguration
          wholesaleEnabled={initialBatch.wholesaleEnabled}
          onToggleChange={(checked) => setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, wholesaleEnabled: checked } }))}
          wholesalePrice={initialBatch.wholesalePrice}
          onPriceChange={(val) => setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, wholesalePrice: val } }))}
          wholesaleMinQty={initialBatch.wholesaleMinQty}
          onMinQtyChange={(val) => setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, wholesaleMinQty: val } }))}
          sellingPrice={initialBatch.selling_price}
          costPrice={initialBatch.cost_price}
        />
      </Grid>
    </Grid>
  </Box>
);

export default ProductInitialBatchSection;
