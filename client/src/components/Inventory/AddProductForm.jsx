import React, { useState, useEffect } from 'react';
import inventoryService from '../../shared/api/inventoryService';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  InputAdornment,
  Divider,
  Switch,
  FormControlLabel,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  QrCode as QrCodeIcon,
  Category as CategoryIcon,
  AddCircle as AddCircleIcon,
  Numbers as NumbersIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../shared/hooks/useCustomDialog';
import WholesaleConfiguration from './WholesaleConfiguration';

const AddProductForm = ({ onProductAdded }) => {
  const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
  const [formData, setFormData] = useState({
    name: '',
    barcodes: [],
    category: '',
    enableBatchTracking: false,
    lowStockWarningEnabled: true,
    lowStockThreshold: 2,
    initialBatch: {
      batch_code: '',
      quantity: '',
      mrp: '',
      cost_price: '',
      selling_price: '',
      wholesaleEnabled: false,
      wholesalePrice: '',
      wholesaleMinQty: '',
      expiryDate: '',
    },
  });
  const [existingCategories, setExistingCategories] = useState([]);
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeChecking, setBarcodeChecking] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [discountInput, setDiscountInput] = useState('0');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await inventoryService.fetchSummary();
        const categoryCounts = data.data?.categoryCounts || {};
        const categories = Object.keys(categoryCounts).filter(Boolean).sort();
        setExistingCategories(categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const toTitleCase = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'barcode') {
      setBarcodeError('');
    }

    if (name === 'initialBatch.discount_percent') {
      setDiscountInput(value);
      const val = parseFloat(value);
      if (!isNaN(val)) {
        const currentMrp = parseFloat(formData.initialBatch.mrp) || 0;
        const newSellingPrice = currentMrp * (1 - val / 100);
        setFormData((prev) => ({
          ...prev,
          initialBatch: {
            ...prev.initialBatch,
            selling_price: Math.max(0, Number(newSellingPrice.toFixed(2))),
          },
        }));
      }
      return;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));

      // Sync discount input if MRP or Selling Price changes
      if (name === 'initialBatch.mrp' || name === 'initialBatch.selling_price') {
        const m =
          name === 'initialBatch.mrp'
            ? parseFloat(value)
            : parseFloat(formData.initialBatch.mrp || 0);
        const s =
          name === 'initialBatch.selling_price'
            ? parseFloat(value)
            : parseFloat(formData.initialBatch.selling_price || 0);

        if (m > 0) {
          const d = ((m - s) / m) * 100;
          setDiscountInput(d.toFixed(1));
        } else {
          setDiscountInput('0');
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addBarcode = async (barcode) => {
    const trimmed = barcode.trim();
    if (!trimmed) return true;

    // Check if barcode already exists in local list
    if (formData.barcodes.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setBarcodeError('Barcode already added');
      return false;
    }

    setBarcodeChecking(true);
    try {
      // Check if barcode exists in database
      try {
        const data = await inventoryService.fetchProductByBarcode(trimmed);
        const existingProduct = data?.product || data;
        const existingName = existingProduct?.name || 'another product';
        setBarcodeError(
          `Barcode '${trimmed}' is already associated with product '${existingName}'`
        );
        setBarcodeChecking(false);
        return false;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // 404 means barcode does not exist in DB, which is what we want for a new product
        } else {
          console.error('Barcode verification failed:', error);
          let errorMessage = 'Unable to verify barcode';
          if (!error.response) {
            errorMessage = 'Network Error: Cannot reach server';
          } else if (error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
          }
          setBarcodeError(errorMessage);
          setBarcodeChecking(false);
          return false;
        }
      }

      setFormData((prev) => ({
        ...prev,
        barcodes: [...prev.barcodes, trimmed],
      }));
      setManualBarcodeInput('');
      setBarcodeError('');
      return true;
    } catch {
      setBarcodeError('Unable to verify barcode');
      return false;
    } finally {
      setBarcodeChecking(false);
    }
  };

  const removeBarcode = (index) => {
    setFormData((prev) => ({
      ...prev,
      barcodes: prev.barcodes.filter((_, i) => i !== index),
    }));
    setBarcodeError('');
  };

  // Generate a unique 13-digit barcode
  const generateBarcode = () => {
    const newBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    addBarcode(newBarcode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If there's pending manual input, try to add it first
    if (manualBarcodeInput.trim()) {
      const success = await addBarcode(manualBarcodeInput);
      if (!success) return;
    }

    if (barcodeChecking || barcodeError) {
      return;
    }
    try {
      const mrp = Number(formData.initialBatch.mrp) || 0;
      const costPrice = Number(formData.initialBatch.cost_price) || 0;
      const sellingPrice = Number(formData.initialBatch.selling_price) || 0;
      const quantity = Number(formData.initialBatch.quantity) || 0;
      if (mrp < 0 || costPrice < 0 || sellingPrice < 0 || quantity < 0) {
        await showError('Values must be zero or greater');
        return;
      }
      if (sellingPrice < costPrice || sellingPrice > mrp) {
        return;
      }
      const payload = {
        name: toTitleCase(formData.name),
        barcode: formData.barcodes.length > 0 ? formData.barcodes.join('|') : null,
        category: formData.category,
        enableBatchTracking: formData.enableBatchTracking,
        lowStockWarningEnabled: formData.lowStockWarningEnabled,
        lowStockThreshold: formData.lowStockWarningEnabled ? Number(formData.lowStockThreshold) : 0,
        initialBatch: {
          ...formData.initialBatch,
          quantity: Number(formData.initialBatch.quantity) || 0,
          mrp: Number(formData.initialBatch.mrp) || 0,
          cost_price: Number(formData.initialBatch.cost_price) || 0,
          selling_price: Number(formData.initialBatch.selling_price) || 0,
          wholesaleEnabled: formData.initialBatch.wholesaleEnabled,
          wholesalePrice: formData.initialBatch.wholesaleEnabled
            ? Number(formData.initialBatch.wholesalePrice) || 0
            : null,
          wholesaleMinQty: formData.initialBatch.wholesaleEnabled
            ? Number(formData.initialBatch.wholesaleMinQty) || 0
            : null,
        },
      };
      await inventoryService.createProduct(payload);
      await showSuccess('Product added successfully!');
      setFormData({
        name: '',
        barcodes: [],
        category: '',
        enableBatchTracking: false,
        lowStockWarningEnabled: false,
        lowStockThreshold: 10,
        initialBatch: {
          batch_code: '',
          quantity: '',
          mrp: '',
          cost_price: '',
          selling_price: '',
          wholesaleEnabled: false,
          wholesalePrice: '',
          wholesaleMinQty: '',
          expiryDate: '',
        },
      });
      setManualBarcodeInput('');
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.error || 'Barcode already exists';
        setBarcodeError(errorMessage);
        await showError(errorMessage);
        return;
      }
      await showError('Failed to add product: ' + (error.response?.data?.error || error.message));
    }
  };

  const mrp = Number(formData.initialBatch.mrp) || 0;
  const sellingPrice = Number(formData.initialBatch.selling_price) || 0;
  const costPrice = Number(formData.initialBatch.cost_price) || 0;
  const sellingBelowCost = sellingPrice < costPrice;
  const sellingAboveMrp = sellingPrice > mrp;
  const sellingInvalid = sellingBelowCost || sellingAboveMrp;
  const discountValue = Math.max(0, mrp - sellingPrice);
  const discountPercent = mrp > 0 ? (discountValue / mrp) * 100 : 0;
  const marginValue = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? (marginValue / sellingPrice) * 100 : 0;
  const vendorDiscountValue = Math.max(0, mrp - costPrice);
  const vendorDiscountPercent = mrp > 0 ? (vendorDiscountValue / mrp) * 100 : 0;
  const wholesalePrice = Number(formData.initialBatch.wholesalePrice) || 0;
  const wholesaleSavings = sellingPrice > 0 ? sellingPrice - wholesalePrice : 0;
  const _wholesalePricePercent =
    sellingPrice > 0 ? (wholesaleSavings / sellingPrice) * 100 : 0;
  const wholesaleMarginValue = wholesalePrice - costPrice;
  const _wholesaleMarginPercent =
    wholesalePrice > 0 ? (wholesaleMarginValue / wholesalePrice) * 100 : 0;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 2.5,
          border: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <AddCircleIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Add New Product
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Capture product details, then set the opening stock and prices.
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InventoryIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Product Essentials
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      name="name"
                      InputLabelProps={{ shrink: true }}
                      value={formData.name}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <InventoryIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      freeSolo
                      options={existingCategories}
                      value={formData.category}
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({ ...prev, category: newValue || '' }));
                      }}
                      onInputChange={(event, newInputValue) => {
                        setFormData((prev) => ({ ...prev, category: newInputValue }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Category"
                          placeholder="Select or type new"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <CategoryIcon color="action" />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs>
                          <TextField
                            fullWidth
                            label="Add Barcode"
                            size="small"
                            value={manualBarcodeInput}
                            onChange={(e) => setManualBarcodeInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addBarcode(manualBarcodeInput);
                              }
                            }}
                            error={Boolean(barcodeError)}
                            helperText={barcodeError}
                            disabled={barcodeChecking}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <QrCodeIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item>
                          <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={generateBarcode}
                            disabled={barcodeChecking}
                            sx={{ height: 40 }}
                          >
                            Generate
                          </Button>
                        </Grid>
                      </Grid>
                      {formData.barcodes.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {formData.barcodes.map((barcode, index) => (
                            <Chip
                              key={index}
                              label={barcode}
                              sx={{
                                backgroundColor: '#2196F3',
                                color: 'white',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                              onDelete={() => removeBarcode(index)}
                              deleteIcon={<CloseIcon />}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1.5 }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.enableBatchTracking}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              enableBatchTracking: event.target.checked,
                            }))
                          }
                        />
                      }
                      label="Enable batch tracking"
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      Turn this on only if you want batch-level stock tracking for this product.
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.lowStockWarningEnabled}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              lowStockWarningEnabled: event.target.checked,
                            }))
                          }
                        />
                      }
                      label="Enable low stock warning"
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      Get notified when stock falls below the threshold.
                    </Typography>
                    {formData.lowStockWarningEnabled && (
                      <TextField
                        fullWidth
                        type="number"
                        label="Low Stock Threshold"
                        value={formData.lowStockThreshold}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))
                        }
                        placeholder="2"
                        sx={{ mt: 2 }}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        helperText={`Less than or equal to ${formData.lowStockThreshold || 2} quantity will be under the low stock warning`}
                      />
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <NumbersIcon color="secondary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Initial Stock & Pricing
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {formData.enableBatchTracking && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Batch Code"
                          name="initialBatch.batch_code"
                          value={formData.initialBatch.batch_code}
                          onChange={handleChange}
                          placeholder="e.g. B001 (leave empty to auto-generate)"
                          InputLabelProps={{ shrink: true }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          Leave empty to auto-generate a unique batch code
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Expiry Date"
                          name="initialBatch.expiryDate"
                          value={formData.initialBatch.expiryDate}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      name="initialBatch.quantity"
                      value={formData.initialBatch.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ inputProps: { min: 0, step: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="MRP"
                      name="initialBatch.mrp"
                      value={formData.initialBatch.mrp}
                      onChange={handleChange}
                      placeholder="0.00"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        inputProps: { min: 0, step: '0.01' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cost Price"
                      name="initialBatch.cost_price"
                      value={formData.initialBatch.cost_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        inputProps: { min: 0, step: '0.01' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3.5}>
                    <TextField
                      fullWidth
                      label="Discount (%)"
                      name="initialBatch.discount_percent"
                      InputLabelProps={{ shrink: true }}
                      value={discountInput}
                      onChange={handleChange}
                      placeholder="0.0"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    md={0.5}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ArrowForwardIcon color="action" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Selling Price"
                      name="initialBatch.selling_price"
                      InputLabelProps={{ shrink: true }}
                      value={formData.initialBatch.selling_price}
                      onChange={handleChange}
                      error={sellingInvalid}
                      helperText={sellingInvalid ? 'Must be ≤ MRP & ≥ Cost' : ' '}
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        inputProps: { min: 0, step: '0.01' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: '#f0f9ff',
                        borderRadius: 1,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        border: '1px solid #e0f2fe',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: '#ed6c02',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        Discount:{' '}
                        <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#ed6c02' }}>
                          ₹{discountValue.toFixed(2)} ({discountPercent.toFixed(1)}%)
                        </Box>
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: '#2e7d32',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        Margin:{' '}
                        <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#2e7d32' }}>
                          ₹{marginValue.toFixed(2)} ({marginPercent.toFixed(1)}%)
                        </Box>
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: '#0288d1',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        Vendor Discount:{' '}
                        <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#0288d1' }}>
                          ₹{vendorDiscountValue.toFixed(2)} ({vendorDiscountPercent.toFixed(1)}%)
                        </Box>
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', my: 2, width: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <WholesaleConfiguration
                      wholesaleEnabled={formData.initialBatch.wholesaleEnabled}
                      onToggleChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          initialBatch: { ...prev.initialBatch, wholesaleEnabled: checked },
                        }))
                      }
                      wholesalePrice={formData.initialBatch.wholesalePrice}
                      onPriceChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          initialBatch: { ...prev.initialBatch, wholesalePrice: value },
                        }))
                      }
                      wholesaleMinQty={formData.initialBatch.wholesaleMinQty}
                      onMinQtyChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          initialBatch: { ...prev.initialBatch, wholesaleMinQty: value },
                        }))
                      }
                      sellingPrice={formData.initialBatch.selling_price}
                      costPrice={formData.initialBatch.cost_price}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              size="large"
              startIcon={<SaveIcon />}
              disabled={barcodeChecking || Boolean(barcodeError)}
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
