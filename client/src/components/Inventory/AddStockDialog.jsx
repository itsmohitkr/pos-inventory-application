import React, { useState, useEffect } from 'react';
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
    Box
} from '@mui/material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

const AddStockDialog = ({ open, onClose, product, onStockAdded }) => {
    const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
    const [stockData, setStockData] = useState({
        batch_code: '',
        quantity: '',
        mrp: '',
        cost_price: '',
        selling_price: '',
        expiryDate: ''
    });

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
                expiryDate: ''
            }));
        }
        if (product && product.batchTrackingEnabled) {
            setStockData(prev => ({
                ...prev,
                batch_code: '',
                quantity: '',
                mrp: '',
                cost_price: '',
                selling_price: '',
                expiryDate: ''
            }));
        }
    }, [open, product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStockData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
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
                quantity: parseInt(stockData.quantity),
                mrp: parseFloat(stockData.mrp),
                cost_price: parseFloat(stockData.cost_price),
                selling_price: parseFloat(stockData.selling_price),
                expiryDate: stockData.expiryDate || null
            };

            const response = await fetch('/api/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add stock');
            }

            await showSuccess('Stock added successfully!');
            setStockData({
                batch_code: '',
                quantity: '',
                mrp: '',
                cost_price: '',
                selling_price: '',
                expiryDate: ''
            });
            if (onStockAdded) onStockAdded();
            onClose();
        } catch (error) {
            console.error(error);
            await showError('Failed to add stock: ' + error.message);
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

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Add Stock for <strong>{product?.name}</strong> ({product?.barcode})
            </DialogTitle>
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
                                    onChange={handleChange}
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
                                    onChange={handleChange}
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
                            value={stockData.quantity}
                            onChange={handleChange}
                            placeholder="0"
                            InputProps={{ inputProps: { min: 0, step: 1 } }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="MRP"
                            name="mrp"
                            value={stockData.mrp}
                            onChange={handleChange}
                            required
                            disabled={!product?.batchTrackingEnabled}
                            error={sellingAboveMrp}
                            helperText={sellingAboveMrp ? 'MRP must be >= selling price' : ''}
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
                            onChange={handleChange}
                            required
                            disabled={!product?.batchTrackingEnabled}
                            error={sellingBelowCost}
                            helperText={sellingBelowCost ? 'Cost must be <= selling price' : ''}
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
                            label="Selling Price"
                            name="selling_price"
                            value={stockData.selling_price}
                            onChange={handleChange}
                            required
                            disabled={!product?.batchTrackingEnabled}
                            error={sellingInvalid}
                            helperText={sellingInvalid ? 'Selling price must be between cost and MRP' : ''}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                inputProps: { min: 0, step: '0.01' }
                            }}
                            placeholder="0.00"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Discount</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        ₹{discountValue.toFixed(2)} ({discountPercent.toFixed(1)}%)
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Margin</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        ₹{marginValue.toFixed(2)} ({marginPercent.toFixed(1)}%)
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
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
