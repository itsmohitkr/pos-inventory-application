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
  Tooltip,
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import useAddProductForm from '@/domains/inventory/components/useAddProductForm';
import ProductBarcodeSection from '@/domains/inventory/components/ProductBarcodeSection';
import ProductInitialBatchSection from '@/domains/inventory/components/ProductInitialBatchSection';
import WholesaleConfiguration from '@/domains/inventory/components/WholesaleConfiguration';
import { inputFieldSx } from '@/domains/inventory/components/inventoryFormStyles';

import type { Product } from '@/shared/types/models';

interface AddProductFormProps {
  mode?: 'add' | 'edit';
  editingProduct?: Product | null;
  onProductAdded?: () => void;
  onProductUpdated?: () => void;
  onClose?: () => void;
}

const AddProductForm = ({
  mode = 'add',
  editingProduct = null,
  onProductAdded,
  onProductUpdated,
  onClose,
}: AddProductFormProps) => {
  const { dialogState, showSuccess, closeDialog } = useCustomDialog();
  const form = useAddProductForm({
    showSuccess,
    onProductAdded,
    mode,
    editingProduct,
    onProductUpdated,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(e);
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} noValidate style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Scrollable Form Body */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'overlay', p: 1.5, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {form.submitError && (
            <Alert
              severity="error"
              onClose={() => form.setSubmitError('')}
              sx={{ mb: 1, borderRadius: '8px', fontWeight: 600 }}
            >
              {form.submitError}
            </Alert>
          )}

          {/* SECTION 1: Product General Info & Barcodes */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '8px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.85rem' }}>
                {mode === 'edit' ? 'Edit Product Details' : 'Basic Product Information'}
              </Typography>
              {mode === 'edit' && editingProduct?.name && (
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem', mt: 0.25, display: 'block' }}>
                  Updating: {editingProduct.name}
                </Typography>
              )}
            </Box>

            <Grid container spacing={2}>
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
                  sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
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
                      sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.85rem' }}>
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

          {/* SECTION 2: Initial Batch Creation (Only in Add Mode) */}
          {mode === 'add' && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '8px',
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
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
          )}

          {/* SECTION 3: Wholesale (Only in Add Mode) & Inventory Alerts */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '8px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            {mode === 'add' && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.85rem' }}>
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

                <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />
              </>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.85rem' }}>
                Inventory Alert Settings
              </Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: form.formData.lowStockWarningEnabled ? 2 : 0 }}>
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
                  label={<Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>Enable Low Stock Warning</Typography>}
                />
                <Tooltip title="Automatically flags product when quantity drops below the alert threshold." arrow placement="top">
                  <InfoIcon sx={{ color: '#64748b', fontSize: '1rem', cursor: 'pointer', '&:hover': { color: '#0b1d39' } }} />
                </Tooltip>
              </Box>
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
                  sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
                />
              )}
            </Box>
          </Paper>
        </Box>

        {/* Fixed Docked Bottom Action Bar */}
        <Box
          sx={{
            p: 1.5,
            px: 2,
            bgcolor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          {onClose && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
              size="small"
              sx={{
                px: 2.5,
                py: 0.75,
                fontWeight: 600,
                fontSize: '0.825rem',
                borderColor: '#cbd5e1',
                color: '#475569',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                borderRadius: '6px',
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            disableElevation
            type="submit"
            size="small"
            disabled={form.barcodeChecking || Boolean(form.barcodeError)}
            sx={{
              px: 3,
              py: 0.75,
              fontWeight: 700,
              fontSize: '0.85rem',
              bgcolor: '#0b1d39 !important',
              color: '#ffffff !important',
              '&:hover': { bgcolor: '#1e293b !important', color: '#ffffff !important' },
              borderRadius: '6px',
            }}
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Product'}
          </Button>
        </Box>
      </form>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default AddProductForm;
