import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, TextField, InputAdornment, Box, Typography, DialogActions, Button, Divider } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import api from '../../shared/api/api';
import useCustomDialog from '../../shared/hooks/useCustomDialog';
import CustomDialog from '../common/CustomDialog';
import WholesaleConfiguration from './WholesaleConfiguration';

const EditBatchDialog = ({ open, onClose, batch, onBatchUpdated }) => {
    const { dialogState, showError, closeDialog } = useCustomDialog();
    const [formData, setFormData] = useState({
        batchCode: '',
        quantity: '',
        mrp: '',
        costPrice: '',
        sellingPrice: '',
        wholesaleEnabled: false,
        wholesalePrice: '',
        wholesaleMinQty: '',
        expiryDate: ''
    });
    const [discountInput, setDiscountInput] = useState('0');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && batch) {
            setFormData({
                batchCode: batch.batchCode || '',
                quantity: batch.quantity || 0,
                mrp: batch.mrp || 0,
                costPrice: batch.costPrice || 0,
                sellingPrice: batch.sellingPrice || 0,
                wholesaleEnabled: batch.wholesaleEnabled || false,
                wholesalePrice: batch.wholesalePrice || '',
                wholesaleMinQty: batch.wholesaleMinQty || '',
                expiryDate: batch.expiryDate ? batch.expiryDate.split('T')[0] : ''
            });

            const m = batch.mrp || 0;
            const s = batch.sellingPrice || 0;
            if (m > 0) {
                setDiscountInput(((m - s) / m * 100).toFixed(1));
            } else {
                setDiscountInput('0');
            }
            setIsSaving(false);
        }
    }, [open, batch]);

    const handleChange = (name, value) => {
        if (name === 'discount_percent') {
            setDiscountInput(value);
            const val = parseFloat(value);
            if (!isNaN(val)) {
                const m = parseFloat(formData.mrp) || 0;
                const newS = m * (1 - val / 100);
                setFormData(prev => ({
                    ...prev,
                    sellingPrice: Math.max(0, Number(newS.toFixed(2)))
                }));
            }
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'mrp' || name === 'sellingPrice') {
            const m = name === 'mrp' ? parseFloat(value) : parseFloat(formData.mrp || 0);
            const s = name === 'sellingPrice' ? parseFloat(value) : parseFloat(formData.sellingPrice || 0);
            if (m > 0) {
                setDiscountInput(((m - s) / m * 100).toFixed(1));
            } else {
                setDiscountInput('0');
            }
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const mrp = Number(formData.mrp) || 0;
        const costPrice = Number(formData.costPrice) || 0;
        const sellingPrice = Number(formData.sellingPrice) || 0;
        const quantity = Number(formData.quantity) || 0;

        if (mrp < 0 || costPrice < 0 || sellingPrice < 0 || quantity < 0) {
            showError('Values must be zero or greater');
            return;
        }

        if (sellingPrice < costPrice || sellingPrice > mrp) {
            showError('Invalid pricing: Selling Price must be between Cost Price and MRP');
            return;
        }

        if (formData.wholesaleEnabled) {
            if (!formData.wholesalePrice || !formData.wholesaleMinQty) {
                showError('Wholesale Price and Minimum Quantity are required when wholesale is enabled');
                return;
            }
            if (Number(formData.wholesalePrice) <= 0 || Number(formData.wholesaleMinQty) <= 0) {
                showError('Wholesale Price and Minimum Quantity must be greater than zero');
                return;
            }
        }

        setIsSaving(true);
        try {
            await api.put(`/api/batches/${batch.id}`, {
                ...formData,
                quantity: Number(formData.quantity),
                mrp,
                costPrice,
                sellingPrice,
                wholesaleEnabled: formData.wholesaleEnabled,
                wholesalePrice: formData.wholesaleEnabled ? (Number(formData.wholesalePrice) || 0) : null,
                wholesaleMinQty: formData.wholesaleEnabled ? (Number(formData.wholesaleMinQty) || 0) : null,
                expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null
            });

            if (onBatchUpdated) {
                onBatchUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Failed to update batch:', error);
            showError('Failed to update batch: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const mrp = Number(formData.mrp) || 0;
    const costPrice = Number(formData.costPrice) || 0;
    const sellingPrice = Number(formData.sellingPrice) || 0;
    const sellingBelowCost = sellingPrice < costPrice;
    const sellingAboveMrp = sellingPrice > mrp;
    const sellingInvalid = sellingBelowCost || sellingAboveMrp;

    const handleKeyDown = (event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
        if (event.target?.tagName === 'TEXTAREA') return;
        event.preventDefault();
        handleSave(event);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth onKeyDown={handleKeyDown}>
                <DialogTitle sx={{ pb: 1 }}>Edit Batch Details</DialogTitle>
                <Divider />
                <DialogContent component="form" onSubmit={handleSave} sx={{ pt: 4, pb: 4 }}>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                            <TextField
                                label="Batch Code"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={formData.batchCode}
                                onChange={(e) => handleChange('batchCode', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Quantity"
                                type="number"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={formData.quantity}
                                onChange={(e) => handleChange('quantity', e.target.value)}
                                placeholder="0"
                                InputProps={{ inputProps: { min: 0, step: 1 } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="MRP"
                                type="number"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={formData.mrp}
                                onChange={(e) => handleChange('mrp', e.target.value)}
                                error={sellingAboveMrp}
                                helperText={sellingAboveMrp ? 'MRP must be >= selling price' : ''}
                                placeholder="0.00"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: '1' }
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Cost Price (CP)"
                                type="number"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={formData.costPrice}
                                onChange={(e) => handleChange('costPrice', e.target.value)}
                                error={sellingBelowCost}
                                helperText={sellingBelowCost ? 'Cost must be <= selling price' : ''}
                                placeholder="0.00"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: '1' }
                                }}
                            />
                        </Grid>

                        <Grid item xs={5}>
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
                        <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowForwardIcon color="action" />
                        </Grid>
                        <Grid item xs={5}>
                            <TextField
                                label="Selling Price (SP)"
                                type="number"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={formData.sellingPrice}
                                onChange={(e) => handleChange('sellingPrice', e.target.value)}
                                error={sellingInvalid}
                                helperText={sellingInvalid ? 'Between CP and MRP' : ''}
                                placeholder="0.00"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: '0.01' }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Expiry Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.expiryDate}
                                onChange={(e) => handleChange('expiryDate', e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', my: 2, width: '100%' }} />
                        </Grid>
                        <Grid item xs={12}>
                            <WholesaleConfiguration
                                wholesaleEnabled={formData.wholesaleEnabled}
                                onToggleChange={(checked) => handleChange('wholesaleEnabled', checked)}
                                wholesalePrice={formData.wholesalePrice}
                                onPriceChange={(val) => handleChange('wholesalePrice', val)}
                                wholesaleMinQty={formData.wholesaleMinQty}
                                onMinQtyChange={(val) => handleChange('wholesaleMinQty', val)}
                                sellingPrice={formData.sellingPrice}
                                costPrice={formData.costPrice}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{
                                p: 1.5,
                                bgcolor: '#f0f9ff',
                                borderRadius: 1,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 3,
                                border: '1px solid #e0f2fe'
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#ed6c02', display: 'flex', alignItems: 'center' }}>
                                    Discount: <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#ed6c02' }}>
                                        ₹{(mrp - sellingPrice).toFixed(2)} ({mrp > 0 ? (((mrp - sellingPrice) / mrp) * 100).toFixed(1) : 0}%)
                                    </Box>
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#2e7d32', display: 'flex', alignItems: 'center' }}>
                                    Margin: <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#2e7d32' }}>
                                        ₹{(sellingPrice - costPrice).toFixed(2)} ({sellingPrice > 0 ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1) : 0}%)
                                    </Box>
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#0288d1', display: 'flex', alignItems: 'center' }}>
                                    Vendor Discount: <Box component="span" sx={{ ml: 0.5, fontWeight: 800, color: '#0288d1' }}>
                                        ₹{(mrp - costPrice).toFixed(2)} ({mrp > 0 ? (((mrp - costPrice) / mrp) * 100).toFixed(1) : 0}%)
                                    </Box>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
            <CustomDialog {...dialogState} onClose={closeDialog} />
        </>
    );
};

export default EditBatchDialog;
