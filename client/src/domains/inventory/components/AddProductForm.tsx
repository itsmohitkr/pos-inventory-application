import React from 'react';
import {
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Divider,
  Switch,
  FormControlLabel,
  Autocomplete,
  Paper,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Save as SaveIcon,
  QrCode as QrCodeIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import useAddProductForm from '@/domains/inventory/components/useAddProductForm';
import ProductBarcodeSection from '@/domains/inventory/components/ProductBarcodeSection';
import ProductInitialBatchSection from '@/domains/inventory/components/ProductInitialBatchSection';
import WholesaleConfiguration from '@/domains/inventory/components/WholesaleConfiguration';

interface AddProductFormProps {
  onProductAdded: () => void;
  onClose?: () => void;
}

const AddProductForm = ({ onProductAdded, onClose }: AddProductFormProps) => {
  const { dialogState, showSuccess, closeDialog } = useCustomDialog();
  const form = useAddProductForm({ showSuccess, onProductAdded });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(e);
  };

  return (
    <>
      <Box sx={{ pb: 6, position: 'relative' }}>
        <form onSubmit={handleFormSubmit} noValidate>
          {form.submitError && (
            <Alert
              severity="error"
              onClose={() => form.setSubmitError('')}
              sx={{ mb: 3, borderRadius: '8px', fontWeight: 600 }}
            >
              {form.submitError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* SECTION 1: Product General Info & Barcodes */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: '12px',
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                '& .MuiOutlinedInput-root': { bgcolor: '#ffffff' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <InventoryIcon sx={{ color: '#0f172a', fontSize: '1.25rem' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Basic Product Information
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Product Name"
                    name="name"
                    InputLabelProps={{ shrink: true }}
                    value={form.formData.name}
                    onChange={form.handleChange}
                    required
                    error={Boolean(form.fieldErrors.name)}
                    helperText={form.fieldErrors.name}
                    placeholder="e.g. Cerelac Wheat Apple 300g"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    freeSolo
                    forcePopupIcon={true}
                    options={form.existingCategories}
                    size="small"
                    value={form.formData.category}
                    onChange={(e, val) =>
                      form.setFormData((prev) => ({ ...prev, category: val || '' }))
                    }
                    onInputChange={(e, val) =>
                      form.setFormData((prev) => ({ ...prev, category: val }))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Product Category"
                        required
                        error={Boolean(form.fieldErrors.category)}
                        helperText={form.fieldErrors.category}
                        placeholder="Select or type new category"
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <QrCodeIcon sx={{ color: '#0f172a', fontSize: '1.25rem' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Barcodes & Identification
                </Typography>
              </Box>
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
            </Paper>

            {/* SECTION 2: Stock, Quantity & Pricing */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: '12px',
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                '& .MuiOutlinedInput-root': { bgcolor: '#ffffff' },
              }}
            >
              <ProductInitialBatchSection
                initialBatch={form.formData.initialBatch}
                enableBatchTracking={form.formData.enableBatchTracking}
                discountInput={form.discountInput}
                sellingInvalid={form.sellingInvalid}
                fieldErrors={form.fieldErrors}
                discountValue={form.discountValue}
                discountPercent={form.discountPercent}
                marginValue={form.marginValue}
                marginPercent={form.marginPercent}
                vendorDiscountValue={form.vendorDiscountValue}
                vendorDiscountPercent={form.vendorDiscountPercent}
                onChange={form.handleChange}
                setFormData={form.setFormData}
              />
            </Paper>

            {/* SECTION 3: Wholesale & Inventory Alerts */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: '12px',
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                '& .MuiOutlinedInput-root': { bgcolor: '#ffffff' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TuneIcon sx={{ color: '#0f172a', fontSize: '1.25rem' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Wholesale Configuration
                </Typography>
              </Box>
              <WholesaleConfiguration
                wholesaleEnabled={form.formData.initialBatch.wholesaleEnabled}
                onToggleChange={(checked) =>
                  form.setFormData((prev) => ({
                    ...prev,
                    initialBatch: { ...prev.initialBatch, wholesaleEnabled: checked },
                  }))
                }
                wholesalePrice={form.formData.initialBatch.wholesalePrice}
                onPriceChange={(val) =>
                  form.setFormData((prev) => ({
                    ...prev,
                    initialBatch: { ...prev.initialBatch, wholesalePrice: val },
                  }))
                }
                wholesaleMinQty={form.formData.initialBatch.wholesaleMinQty}
                onMinQtyChange={(val) =>
                  form.setFormData((prev) => ({
                    ...prev,
                    initialBatch: { ...prev.initialBatch, wholesaleMinQty: val },
                  }))
                }
                sellingPrice={form.formData.initialBatch.selling_price}
                costPrice={form.formData.initialBatch.cost_price}
                fieldErrors={form.fieldErrors}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Inventory Alert Settings
                </Typography>
              </Box>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.formData.lowStockWarningEnabled}
                      onChange={(e) =>
                        form.setFormData((prev) => ({
                          ...prev,
                          lowStockWarningEnabled: e.target.checked,
                        }))
                      }
                    />
                  }
                  label={<Typography fontWeight={600}>Enable Low Stock Warning</Typography>}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Automatically flags product when quantity drops below the alert threshold.
                </Typography>
                {form.formData.lowStockWarningEnabled && (
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Low Stock Threshold"
                    value={form.formData.lowStockThreshold}
                    onChange={(e) =>
                      form.setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))
                    }
                    placeholder="2"
                    error={Boolean(form.fieldErrors.lowStockThreshold)}
                    helperText={
                      form.fieldErrors.lowStockThreshold ||
                      `Alerts when stock is ≤ ${form.formData.lowStockThreshold || 2} units`
                    }
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ inputProps: { min: 0, step: 1 } }}
                  />
                )}
              </Box>
            </Paper>
          </Box>

          {/* Fixed Solid Bottom Action Bar */}
          <Box
            sx={{
              position: 'sticky',
              bottom: { xs: -16, md: -24 },
              bgcolor: '#ffffff',
              pt: 2,
              pb: { xs: 2, md: 3 },
              mt: 3,
              zIndex: 20,
              borderTop: '1px solid #cbd5e1',
              mx: { xs: -2, md: -3 },
              px: { xs: 2, md: 3 },
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 -6px 16px rgba(0,0,0,0.06)',
            }}
          >
            {onClose && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={onClose}
                size="large"
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                  borderRadius: '8px',
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              disableElevation
              type="submit"
              size="large"
              startIcon={<SaveIcon sx={{ color: '#ffffff !important' }} />}
              disabled={form.barcodeChecking || Boolean(form.barcodeError)}
              sx={{
                px: 4,
                py: 1,
                fontWeight: 700,
                fontSize: '0.95rem',
                bgcolor: '#0f172a !important',
                color: '#ffffff !important',
                '&:hover': { bgcolor: '#1e293b !important', color: '#ffffff !important' },
                '&:focus': { bgcolor: '#0f172a !important', color: '#ffffff !important' },
                '&:active': { bgcolor: '#0f172a !important', color: '#ffffff !important' },
                '& .MuiButton-startIcon': { color: '#ffffff !important' },
                '& .MuiSvgIcon-root': { color: '#ffffff !important' },
                borderRadius: '8px',
              }}
            >
              Add Product
            </Button>
          </Box>
        </form>
      </Box>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default AddProductForm;
