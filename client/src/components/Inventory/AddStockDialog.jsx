import React, { useState, useEffect } from 'react';
import api from '../../shared/api/api';
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
    Paper,
    Box,
    Divider
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import useCustomDialog from '../../shared/hooks/useCustomDialog';
import CustomDialog from '../common/CustomDialog';
import WholesaleConfiguration from './WholesaleConfiguration';

const AddStockDialog = ({ open, onClose, product, onStockAdded }) => {
    const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
    const [stockData, setStockData] = useState({
        batch_code: '',
        quantity: '',
        mrp: '',
        cost_price: '',
        selling_price: '',
        wholesaleEnabled: false,
        wholesalePrice: '',
        wholesaleMinQty: '',
        expiryDate: ''
    });
    const [discountInput, setDiscountInput] = useState('0');
    const [formSubmitted, setFormSubmitted] = useState(false);

    const isFieldEmpty = (val) => val === undefined || val === null || val.toString().trim() === '';

    useEffect(() => {
        if (!open) return;

        const firstBatch = product?.batches?.[0];
        if (product && !product.batchTrackingEnabled && firstBatch) {
            setStockData(prev => ({
                ...prev,
                batch_code: '',
                quantity: '',
                mrp: firstBatch.mrp ?? prev.mrp,
                cost_price: firstBatch.costPrice ?? prev.cost_price,
                selling_price: firstBatch.sellingPrice ?? prev.selling_price,
                wholesaleEnabled: firstBatch.wholesaleEnabled ?? false,
                wholesalePrice: firstBatch.wholesalePrice ?? '',
                wholesaleMinQty: firstBatch.wholesaleMinQty ?? '',
                expiryDate: ''
            }));
            const m = firstBatch.mrp || 0;
            const s = firstBatch.sellingPrice || 0;
            if (m > 0) {
                setDiscountInput(((m - s) / m * 100).toFixed(1));
            }
        }
        if (product && product.batchTrackingEnabled) {
            setStockData(prev => ({
                ...prev,
                batch_code: '',
                quantity: '',
                mrp: '',
                cost_price: '',
                selling_price: '',
                wholesaleEnabled: false,
                wholesalePrice: '',
                wholesaleMinQty: '',
                expiryDate: ''
            }));
            setDiscountInput('0');
            setFormSubmitted(false);
        }
    }, [open, product]);

    const handleChange = (name, value) => {
        if (name === 'discount_percent') {
            setDiscountInput(value);
            const val = parseFloat(value);
            if (!isNaN(val)) {
                const m = parseFloat(stockData.mrp) || 0;
                const newS = m * (1 - val / 100);
                setStockData(prev => ({
                    ...prev,
                    selling_price: Math.max(0, Number(newS.toFixed(2)))
                }));
            }
            return;
        }

        setStockData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'mrp' || name === 'selling_price') {
            const m = name === 'mrp' ? parseFloat(value) : parseFloat(stockData.mrp || 0);
            const s = name === 'selling_price' ? parseFloat(value) : parseFloat(stockData.selling_price || 0);
            if (m > 0) {
                setDiscountInput(((m - s) / m * 100).toFixed(1));
            } else {
                setDiscountInput('0');
            }
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setFormSubmitted(true);

        const isQuantityEmpty = isFieldEmpty(stockData.quantity);
        const isMrpEmpty = isFieldEmpty(stockData.mrp);
        const isCostEmpty = isFieldEmpty(stockData.cost_price);
        const isSellingEmpty = isFieldEmpty(stockData.selling_price);

        if (isQuantityEmpty || isMrpEmpty || isCostEmpty || isSellingEmpty) {
            return;
        }

        if (stockData.wholesaleEnabled) {
            if (isFieldEmpty(stockData.wholesalePrice) || isFieldEmpty(stockData.wholesaleMinQty)) {
                return;
            }
        }

        try {
            const mrp = Number(stockData.mrp) || 0;
            const costPrice = Number(stockData.cost_price) || 0;
            const sellingPrice = Number(stockData.selling_price) || 0;
            const quantity = Number(stockData.quantity) || 0;
            if (mrp < 0 || costPrice < 0 || sellingPrice < 0 || quantity < 0) {
                await showError('Values must be zero or greater');
                return;
            }
            if (sellingPrice < costPrice || sellingPrice > mrp) {
                return;
            }
            const payload = {
                product_id: product.id,
                batch_code: stockData.batch_code,
                quantity: parseInt(stockData.quantity) || 0,
                mrp: parseFloat(stockData.mrp) || 0,
                cost_price: parseFloat(stockData.cost_price) || 0,
                selling_price: parseFloat(stockData.selling_price) || 0,
                wholesaleEnabled: stockData.wholesaleEnabled,
                wholesalePrice: stockData.wholesaleEnabled ? (parseFloat(stockData.wholesalePrice) || 0) : null,
                wholesaleMinQty: stockData.wholesaleEnabled ? (parseInt(stockData.wholesaleMinQty) || 0) : null,
                expiryDate: stockData.expiryDate || null
            };

            await api.post('/api/batches', payload);

            await showSuccess('Stock added successfully!');
            setStockData({
                batch_code: '',
                quantity: '',
                mrp: '',
                cost_price: '',
                selling_price: '',
                wholesaleEnabled: false,
                wholesalePrice: '',
                wholesaleMinQty: '',
                expiryDate: ''
            });
            setDiscountInput('0');
            setFormSubmitted(false);
            if (onStockAdded) onStockAdded();
            onClose();
        } catch (error) {
            console.error(error);
            await showError('Failed to add stock: ' + (error.response?.data?.error || error.message));
        }
    };

    const mrp = Number(stockData.mrp) || 0;
    const sellingPrice = Number(stockData.selling_price) || 0;
    const costPrice = Number(stockData.cost_price) || 0;
    const sellingBelowCost = sellingPrice < costPrice;
    const sellingAboveMrp = sellingPrice > mrp;
    const sellingInvalid = sellingBelowCost || sellingAboveMrp;
    const discountValue = Math.max(0, mrp - sellingPrice);
    const discountPercent = mrp > 0 ? (discountValue / mrp) * 100 : 0;
    const marginValue = sellingPrice - costPrice;
    const marginPercent = sellingPrice > 0 ? (marginValue / sellingPrice) * 100 : 0;
    const vendorDiscountValue = Math.max(0, mrp - costPrice);
    const vendorDiscountPercent = mrp > 0 ? (vendorDiscountValue / mrp) * 100 : 0;

    const handleKeyDown = (event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
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
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Batch Code"
                                        name="batch_code"
                                        value={stockData.batch_code}
                                        onChange={(e) => handleChange('batch_code', e.target.value)}
                                        placeholder="e.g. B002 (leave empty to auto-generate)"
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                        Leave empty to auto-generate a unique batch code
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
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
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Quantity"
                                name="quantity"
                                value={(stockData.quantity === 0 && !stockData.quantity.toString().includes('.')) ? '' : stockData.quantity}
                                onChange={(e) => handleChange('quantity', e.target.value)}
                                placeholder="0"
                                InputProps={{ inputProps: { min: 0, step: 1 } }}
                                required
                                error={formSubmitted && isFieldEmpty(stockData.quantity)}
                                helperText={formSubmitted && isFieldEmpty(stockData.quantity) ? 'Required' : ''}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="MRP"
                                name="mrp"
                                value={stockData.mrp}
                                onChange={(e) => handleChange('mrp', e.target.value)}
                                required
                                error={sellingAboveMrp || (formSubmitted && isFieldEmpty(stockData.mrp))}
                                helperText={sellingAboveMrp ? 'MRP must be >= selling price' : (formSubmitted && isFieldEmpty(stockData.mrp) ? 'Required' : '')}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: '0.01' }
                                }}
                                placeholder="0.00"
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Cost Price"
                                name="cost_price"
                                value={stockData.cost_price}
                                onChange={(e) => handleChange('cost_price', e.target.value)}
                                required
                                error={sellingBelowCost || (formSubmitted && isFieldEmpty(stockData.cost_price))}
                                helperText={sellingBelowCost ? 'Cost must be <= selling price' : (formSubmitted && isFieldEmpty(stockData.cost_price) ? 'Required' : '')}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: '0.01' }
                                }}
                                placeholder="0.00"
                            />
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
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
                        <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowForwardIcon color="action" />
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Selling Price"
                                name="selling_price"
                                value={stockData.selling_price}
                                onChange={(e) => handleChange('selling_price', e.target.value)}
                                required
                                error={sellingInvalid || (formSubmitted && isFieldEmpty(stockData.selling_price))}
                                helperText={sellingInvalid ? 'Between CP and MRP' : (formSubmitted && isFieldEmpty(stockData.selling_price) ? 'Required' : '')}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: '0.01' }
                                }}
                                placeholder="0.00"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', my: 1, width: '100%' }} />
                        </Grid>
                        <Grid item xs={12}>
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
                        <Grid item xs={12}>
                            <Box sx={{
                                p: 1.5,
                                bgcolor: '#f0f9ff',
                                borderRadius: 1.5,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 3,
                                border: '1px solid #e0f2fe'
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#ed6c02', display: 'flex', alignItems: 'center' }}>
                                    Discount: <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#ed6c02' }}>
                                        ₹{discountValue.toFixed(2)} ({discountPercent.toFixed(1)}%)
                                    </Box>
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#2e7d32', display: 'flex', alignItems: 'center' }}>
                                    Margin: <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#2e7d32' }}>
                                        ₹{marginValue.toFixed(2)} ({marginPercent.toFixed(1)}%)
                                    </Box>
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#0288d1', display: 'flex', alignItems: 'center' }}>
                                    Vendor Discount: <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#0288d1' }}>
                                        ₹{vendorDiscountValue.toFixed(2)} ({vendorDiscountPercent.toFixed(1)}%)
                                    </Box>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onClose} variant="outlined">Cancel</Button>
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
