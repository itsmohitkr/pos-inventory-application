import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  InputAdornment,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import WholesaleConfiguration from '@/domains/inventory/components/WholesaleConfiguration';
import { useAddStock } from '@/domains/inventory/components/useAddStock';

const AddStockDialog = ({ open, onClose, product, onStockAdded }) => {
  const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();

  const {
    stockData,
    discountInput,
    formSubmitted,
    handleChange,
    handleSubmit,
    calculations,
    isFieldEmpty,
  } = useAddStock({ product, open, onClose, onStockAdded, showError, showSuccess });

  const {
    sellingBelowCost,
    sellingAboveMrp,
    discountValue,
    discountPercent,
    marginValue,
    marginPercent,
    vendorDiscountValue,
    vendorDiscountPercent,
  } = calculations;

  const sellingInvalid = sellingBelowCost || sellingAboveMrp;

  const handleKeyDown = (event) => {
    if (event.defaultPrevented || event.key !== 'Enter' || event.shiftKey) return;
    if (event.target?.tagName === 'TEXTAREA') return;
    event.preventDefault();
    handleSubmit(event);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth onKeyDown={handleKeyDown}>
        <DialogTitle sx={{ pb: 1 }}>
          Add Stock for <strong>{product?.name}</strong> ({product?.barcode || 'N/A'})
        </DialogTitle>
        <Divider />
        <DialogContent component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {product?.batchTrackingEnabled && (
              <>
                <Grid size={{ xs: 12 }} sm={6}>
                  <TextField
                    fullWidth
                    label="Batch Code"
                    name="batch_code"
                    value={stockData.batch_code}
                    onChange={(e) => handleChange('batch_code', e.target.value)}
                    placeholder="e.g. B002 (leave empty to auto-generate)"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Leave empty to auto-generate a unique batch code
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expiry Date"
                    name="expiryDate"
                    value={stockData.expiryDate}
                    onChange={(e) => handleChange('expiryDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12 }} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                name="quantity"
                value={
                  stockData.quantity === 0 && !stockData.quantity.toString().includes('.')
                    ? ''
                    : stockData.quantity
                }
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="0"
                InputProps={{ inputProps: { min: 0, step: 1 } }}
                required
                error={formSubmitted && isFieldEmpty(stockData.quantity)}
                helperText={formSubmitted && isFieldEmpty(stockData.quantity) ? 'Required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="MRP"
                name="mrp"
                value={stockData.mrp}
                onChange={(e) => handleChange('mrp', e.target.value)}
                required
                error={sellingAboveMrp || (formSubmitted && isFieldEmpty(stockData.mrp))}
                helperText={
                  sellingAboveMrp
                    ? 'MRP must be >= selling price'
                    : formSubmitted && isFieldEmpty(stockData.mrp)
                      ? 'Required'
                      : ''
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: '0.01' },
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid size={{ xs: 12 }} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Cost Price"
                name="cost_price"
                value={stockData.cost_price}
                onChange={(e) => handleChange('cost_price', e.target.value)}
                required
                error={sellingBelowCost || (formSubmitted && isFieldEmpty(stockData.cost_price))}
                helperText={
                  sellingBelowCost
                    ? 'Cost must be <= selling price'
                    : formSubmitted && isFieldEmpty(stockData.cost_price)
                      ? 'Required'
                      : ''
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: '0.01' },
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid size={{ xs: 12 }} sm={2.5}>
              <TextField
                label="Discount (%)"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={discountInput}
                onChange={(e) => handleChange('discount_percent', e.target.value)}
                placeholder="0.0"
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 1 }}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowForwardIcon color="action" />
            </Grid>
            <Grid size={{ xs: 12 }} sm={2.5}>
              <TextField
                fullWidth
                type="number"
                label="Selling Price"
                name="selling_price"
                value={stockData.selling_price}
                onChange={(e) => handleChange('selling_price', e.target.value)}
                required
                error={sellingInvalid || (formSubmitted && isFieldEmpty(stockData.selling_price))}
                helperText={
                  sellingInvalid
                    ? 'Between CP and MRP'
                    : formSubmitted && isFieldEmpty(stockData.selling_price)
                      ? 'Required'
                      : ''
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: '0.01' },
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', my: 1, width: '100%' }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <WholesaleConfiguration
                wholesaleEnabled={stockData.wholesaleEnabled}
                onToggleChange={(checked) => handleChange('wholesaleEnabled', checked)}
                wholesalePrice={stockData.wholesalePrice}
                onPriceChange={(val) => handleChange('wholesalePrice', val)}
                wholesaleMinQty={stockData.wholesaleMinQty}
                onMinQtyChange={(val) => handleChange('wholesaleMinQty', val)}
                sellingPrice={stockData.selling_price}
                costPrice={stockData.cost_price}
                showErrors={formSubmitted}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#f0f9ff',
                  borderRadius: 1.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  border: '1px solid #e0f2fe',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#ed6c02', display: 'flex', alignItems: 'center' }}
                >
                  Discount:{' '}
                  <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#ed6c02' }}>
                    ₹{discountValue.toFixed(2)} ({discountPercent.toFixed(1)}%)
                  </Box>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#2e7d32', display: 'flex', alignItems: 'center' }}
                >
                  Margin:{' '}
                  <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#2e7d32' }}>
                    ₹{marginValue.toFixed(2)} ({marginPercent.toFixed(1)}%)
                  </Box>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#0288d1', display: 'flex', alignItems: 'center' }}
                >
                  Vendor Discount:{' '}
                  <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#0288d1' }}>
                    ₹{vendorDiscountValue.toFixed(2)} ({vendorDiscountPercent.toFixed(1)}%)
                  </Box>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" type="submit">
            Add Stock
          </Button>
        </DialogActions>
      </Dialog>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default AddStockDialog;
