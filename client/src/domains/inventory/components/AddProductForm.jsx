import React from 'react';
import {
  Paper, Typography, TextField, Button, Grid, Box,
  InputAdornment, Divider, Switch, FormControlLabel, Autocomplete,
} from '@mui/material';
import {
  Inventory as InventoryIcon, Category as CategoryIcon,
  AddCircle as AddCircleIcon, Save as SaveIcon,
} from '@mui/icons-material';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import useAddProductForm from '@/domains/inventory/components/useAddProductForm';
import ProductBarcodeSection from '@/domains/inventory/components/ProductBarcodeSection';
import ProductInitialBatchSection from '@/domains/inventory/components/ProductInitialBatchSection';

const AddProductForm = ({ onProductAdded }) => {
  const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
  const form = useAddProductForm({ showError, showSuccess, onProductAdded });

  return (
    <>
      <Paper elevation={0} sx={{ mb: 4, p: 4, borderRadius: 2.5, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <AddCircleIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>Add New Product</Typography>
            <Typography variant="subtitle1" color="text.secondary">Capture product details, then set the opening stock and prices.</Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={form.handleSubmit}>
          <Grid container spacing={3}>
            {/* Left: Product Essentials */}
            <Grid item xs={12} lg={7}>
              <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InventoryIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>Product Essentials</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth label="Product Name" name="name"
                      InputLabelProps={{ shrink: true }} value={form.formData.name}
                      onChange={form.handleChange} required
                      InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon color="action" /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      freeSolo options={form.existingCategories}
                      value={form.formData.category}
                      onChange={(e, val) => form.setFormData((prev) => ({ ...prev, category: val || '' }))}
                      onInputChange={(e, val) => form.setFormData((prev) => ({ ...prev, category: val }))}
                      renderInput={(params) => (
                        <TextField {...params} label="Category" placeholder="Select or type new" InputLabelProps={{ shrink: true }}
                          InputProps={{ ...params.InputProps, startAdornment: (<><InputAdornment position="start"><CategoryIcon color="action" /></InputAdornment>{params.InputProps.startAdornment}</>) }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ProductBarcodeSection
                      manualBarcodeInput={form.manualBarcodeInput}
                      setManualBarcodeInput={form.setManualBarcodeInput}
                      barcodes={form.formData.barcodes}
                      barcodeError={form.barcodeError}
                      barcodeChecking={form.barcodeChecking}
                      onAddBarcode={form.addBarcode}
                      onRemoveBarcode={form.removeBarcode}
                      onGenerate={form.generateBarcode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1.5 }} />
                    <FormControlLabel
                      control={<Switch checked={form.formData.enableBatchTracking} onChange={(e) => form.setFormData((prev) => ({ ...prev, enableBatchTracking: e.target.checked }))} />}
                      label="Enable batch tracking"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Turn this on only if you want batch-level stock tracking for this product.
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <FormControlLabel
                      control={<Switch checked={form.formData.lowStockWarningEnabled} onChange={(e) => form.setFormData((prev) => ({ ...prev, lowStockWarningEnabled: e.target.checked }))} />}
                      label="Enable low stock warning"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Get notified when stock falls below the threshold.
                    </Typography>
                    {form.formData.lowStockWarningEnabled && (
                      <TextField
                        fullWidth type="number" label="Low Stock Threshold"
                        value={form.formData.lowStockThreshold}
                        onChange={(e) => form.setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                        placeholder="2" sx={{ mt: 2 }} InputLabelProps={{ shrink: true }}
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        helperText={`Less than or equal to ${form.formData.lowStockThreshold || 2} quantity will be under the low stock warning`}
                      />
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Right: Initial Stock & Pricing */}
            <Grid item xs={12} lg={6}>
              <ProductInitialBatchSection
                initialBatch={form.formData.initialBatch}
                enableBatchTracking={form.formData.enableBatchTracking}
                discountInput={form.discountInput}
                sellingInvalid={form.sellingInvalid}
                discountValue={form.discountValue}
                discountPercent={form.discountPercent}
                marginValue={form.marginValue}
                marginPercent={form.marginPercent}
                vendorDiscountValue={form.vendorDiscountValue}
                vendorDiscountPercent={form.vendorDiscountPercent}
                onChange={form.handleChange}
                setFormData={form.setFormData}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" color="primary" type="submit" size="large"
              startIcon={<SaveIcon />}
              disabled={form.barcodeChecking || Boolean(form.barcodeError)}
              sx={{ px: 5, py: 1.5, fontWeight: 600 }}
            >
              Add Product
            </Button>
          </Box>
        </form>
      </Paper>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default AddProductForm;
