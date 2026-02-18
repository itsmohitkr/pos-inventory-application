import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Paper, Typography, TextField, Button, Grid, Box, InputAdornment,
    Divider, Switch, FormControlLabel, Autocomplete, Chip
} from '@mui/material';
import {
    Inventory as InventoryIcon,
    QrCode as QrCodeIcon,
    Category as CategoryIcon,
    AddCircle as AddCircleIcon,
    Numbers as NumbersIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

const AddProductForm = ({ onProductAdded }) => {
    const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
    const [formData, setFormData] = useState({
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
            expiryDate: ''
        }
    });
    const [existingCategories, setExistingCategories] = useState([]);
    const [barcodeError, setBarcodeError] = useState('');
    const [barcodeChecking, setBarcodeChecking] = useState(false);
    const [manualBarcodeInput, setManualBarcodeInput] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/products/summary');
                const categoryCounts = response.data.data?.categoryCounts || {};
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
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'barcode') {
            setBarcodeError('');
        }
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const addBarcode = async (barcode) => {
        const trimmed = barcode.trim();
        if (!trimmed) return;

        // Check if barcode already exists in local list
        if (formData.barcodes.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
            setBarcodeError('Barcode already added');
            return;
        }

        setBarcodeChecking(true);
        try {
            // Check if barcode exists in database
            try {
                await axios.get(`/api/products/${encodeURIComponent(trimmed)}`);
                setBarcodeError(`Barcode '${trimmed}' already exists in database`);
                setBarcodeChecking(false);
                return;
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    // 404 means barcode does not exist in DB, which is what we want for a new product
                } else {
                    console.error("Barcode verification failed:", error);
                    let errorMessage = 'Unable to verify barcode';
                    if (!error.response) {
                        errorMessage = 'Network Error: Cannot reach server';
                    } else if (error.response.data && error.response.data.error) {
                        errorMessage = error.response.data.error;
                    }
                    setBarcodeError(errorMessage);
                    setBarcodeChecking(false);
                    return;
                }
            }

            setFormData(prev => ({
                ...prev,
                barcodes: [...prev.barcodes, trimmed]
            }));
            setManualBarcodeInput('');
            setBarcodeError('');
        } catch (error) {
            setBarcodeError('Unable to verify barcode');
        } finally {
            setBarcodeChecking(false);
        }
    };

    const removeBarcode = (index) => {
        setFormData(prev => ({
            ...prev,
            barcodes: prev.barcodes.filter((_, i) => i !== index)
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
        try {
            if (barcodeChecking || barcodeError) {
                return;
            }
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
                    selling_price: Number(formData.initialBatch.selling_price) || 0
                }
            };
            await axios.post('/api/products', payload);
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
                    expiryDate: ''
                }
            });
            setManualBarcodeInput('');
            if (onProductAdded) {
                onProductAdded();
            }
        } catch (error) {
            console.error(error);
            if (error.response?.status === 409) {
                setBarcodeError(error.response?.data?.error || 'Barcode already exists');
                return;
            }
            await showError('Failed to add product');
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

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    p: 3,
                    borderRadius: 2.5,
                    border: '1px solid rgba(15, 23, 42, 0.08)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
                        <Grid item xs={12} lg={6}>
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
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><InventoryIcon color="action" /></InputAdornment>,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            freeSolo
                                            options={existingCategories}
                                            value={formData.category}
                                            onChange={(event, newValue) => {
                                                setFormData(prev => ({ ...prev, category: newValue || '' }));
                                            }}
                                            onInputChange={(event, newInputValue) => {
                                                setFormData(prev => ({ ...prev, category: newInputValue }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Category"
                                                    placeholder="Select or type new"
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
                                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Barcodes</Typography>
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
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start"><QrCodeIcon color="action" /></InputAdornment>,
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
                                                                fontWeight: 600
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
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            enableBatchTracking: event.target.checked
                                                        }))}
                                                />
                                            }
                                            label="Enable batch tracking"
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            Turn this on only if you want batch-level stock tracking for this product.
                                        </Typography>

                                        <Divider sx={{ my: 1.5 }} />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.lowStockWarningEnabled}
                                                    onChange={(event) =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            lowStockWarningEnabled: event.target.checked
                                                        }))}
                                                />
                                            }
                                            label="Enable low stock warning"
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            Get notified when stock falls below the threshold.
                                        </Typography>
                                        {formData.lowStockWarningEnabled && (
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Low Stock Threshold"
                                                value={formData.lowStockThreshold}
                                                onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                                                placeholder="10"
                                                sx={{ mt: 2 }}
                                                InputProps={{ inputProps: { min: 0, step: 1 } }}
                                                helperText="Alert when stock quantity falls below this number"
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
                                                />
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
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
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                inputProps: { min: 0, step: '0.01' }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Cost Price"
                                            name="initialBatch.cost_price"
                                            value={formData.initialBatch.cost_price}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                inputProps: { min: 0, step: '0.01' }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Selling Price"
                                            name="initialBatch.selling_price"
                                            value={formData.initialBatch.selling_price}
                                            onChange={handleChange}
                                            error={sellingInvalid}
                                            helperText={sellingInvalid ? 'Selling price must be between cost and MRP' : ' '}
                                            placeholder="0.00"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                inputProps: { min: 0, step: '0.01' }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Typography variant="caption" color="text.secondary">Discount: ₹{discountValue.toFixed(2)} ({discountPercent.toFixed(1)}%)</Typography>
                                            <Typography variant="caption" color="text.secondary">Margin: ₹{marginValue.toFixed(2)} ({marginPercent.toFixed(1)}%)</Typography>
                                        </Box>
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
