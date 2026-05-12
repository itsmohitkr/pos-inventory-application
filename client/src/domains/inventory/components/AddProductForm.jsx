import React, { useState } from 'react';
import {
  Typography, TextField, Button, Grid, Box,
  InputAdornment, Divider, Switch, FormControlLabel, Autocomplete, Tabs, Tab, Fade
} from '@mui/material';
import {
  Inventory as InventoryIcon, Category as CategoryIcon,
  Save as SaveIcon, Settings as SettingsIcon, Numbers as NumbersIcon
} from '@mui/icons-material';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import useAddProductForm from '@/domains/inventory/components/useAddProductForm';
import ProductBarcodeSection from '@/domains/inventory/components/ProductBarcodeSection';
import ProductInitialBatchSection from '@/domains/inventory/components/ProductInitialBatchSection';
import WholesaleConfiguration from '@/domains/inventory/components/WholesaleConfiguration';

const AddProductForm = ({ onProductAdded }) => {
  const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
  const form = useAddProductForm({ showError, showSuccess, onProductAdded });
  const [activeTab, setActiveTab] = useState(0);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (activeTab < 2) {
      setActiveTab((prev) => prev + 1);
      return;
    }
    if (!form.formData.name.trim()) {
      setActiveTab(0);
      showError('Product Name is required.');
      return;
    }
    form.handleSubmit(e);
  };

  return (
    <>
      <Box sx={{ pb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, val) => setActiveTab(val)} 
            textColor="primary" 
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab label="Product Details" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }} />
            <Tab label="Stock & Quantity" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }} />
            <Tab label="Settings" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }} />
          </Tabs>
        </Box>

        <form onSubmit={handleFormSubmit} noValidate>
          {/* Tab 0 */}
          {activeTab === 0 && (
            <Fade in={true} timeout={300}>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  General Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth size="small" label="Product Name" name="name"
                      InputLabelProps={{ shrink: true }} value={form.formData.name}
                      onChange={form.handleChange} required
                      InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon color="action" /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Autocomplete
                      freeSolo options={form.existingCategories}
                      size="small"
                      value={form.formData.category}
                      onChange={(e, val) => form.setFormData((prev) => ({ ...prev, category: val || '' }))}
                      onInputChange={(e, val) => form.setFormData((prev) => ({ ...prev, category: val }))}
                      renderInput={(params) => (
                        <TextField {...params} size="small" label="Category" InputLabelProps={{ shrink: true }}
                          InputProps={{ ...params.InputProps, startAdornment: (<><InputAdornment position="start"><CategoryIcon color="action" /></InputAdornment>{params.InputProps.startAdornment}</>) }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }} />

                <Typography variant="subtitle2" color="primary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  Barcodes
                </Typography>
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
              </Box>
            </Fade>
          )}

          {/* Tab 1 */}
          {activeTab === 1 && (
            <Fade in={true} timeout={300}>
              <Box>
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
              </Box>
            </Fade>
          )}

          {/* Tab 2 */}
          {activeTab === 2 && (
            <Fade in={true} timeout={300}>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  Wholesale Pricing
                </Typography>
                <WholesaleConfiguration
                  wholesaleEnabled={form.formData.initialBatch.wholesaleEnabled}
                  onToggleChange={(checked) => form.setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, wholesaleEnabled: checked } }))}
                  wholesalePrice={form.formData.initialBatch.wholesalePrice}
                  onPriceChange={(val) => form.setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, wholesalePrice: val } }))}
                  wholesaleMinQty={form.formData.initialBatch.wholesaleMinQty}
                  onMinQtyChange={(val) => form.setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, wholesaleMinQty: val } }))}
                  sellingPrice={form.formData.initialBatch.selling_price}
                  costPrice={form.formData.initialBatch.cost_price}
                />

                <Divider sx={{ my: 4 }} />

                <Typography variant="subtitle2" color="primary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  Inventory Alerts
                </Typography>
                <Box>
                  <FormControlLabel
                    control={<Switch checked={form.formData.lowStockWarningEnabled} onChange={(e) => form.setFormData((prev) => ({ ...prev, lowStockWarningEnabled: e.target.checked }))} />}
                    label={<Typography fontWeight={500}>Enable low stock warning</Typography>}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Get notified when stock falls below the threshold.
                  </Typography>
                  {form.formData.lowStockWarningEnabled && (
                    <TextField
                      fullWidth size="small" type="number" label="Low Stock Threshold"
                      value={form.formData.lowStockThreshold}
                      onChange={(e) => form.setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                      placeholder="2" InputLabelProps={{ shrink: true }}
                      InputProps={{ inputProps: { min: 0, step: 1 } }}
                      helperText={`Less than or equal to ${form.formData.lowStockThreshold || 2} quantity will be under the low stock warning`}
                    />
                  )}
                </Box>
              </Box>
            </Fade>
          )}

          <Box sx={{ 
            position: 'sticky', 
            bottom: { xs: -16, md: -24 }, 
            bgcolor: '#ffffff', 
            pt: 2, 
            pb: { xs: 2, md: 3 }, 
            mt: 6, 
            zIndex: 10,
            borderTop: '1px solid', borderColor: 'divider',
            mx: { xs: -2, md: -3 }, px: { xs: 2, md: 3 },
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            {activeTab > 0 ? (
              <Button type="button" onClick={() => setActiveTab(prev => prev - 1)} size="large">Back</Button>
            ) : <Box />}
            
            {activeTab < 2 ? (
              <Button key="btn-next" type="button" variant="contained" color="primary" onClick={() => setActiveTab(prev => prev + 1)} size="large" sx={{ px: 5, fontWeight: 600 }}>
                Next
              </Button>
            ) : (
              <Button
                key="btn-submit"
                variant="contained" color="primary" type="submit" size="large"
                startIcon={<SaveIcon />}
                disabled={form.barcodeChecking || Boolean(form.barcodeError)}
                sx={{ px: 5, fontWeight: 600 }}
              >
                Add Product
              </Button>
            )}
          </Box>
        </form>
      </Box>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default AddProductForm;
