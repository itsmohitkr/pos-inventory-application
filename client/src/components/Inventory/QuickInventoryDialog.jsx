import React, { useState } from 'react';
import api from '../../api';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box
} from '@mui/material';
import CustomDialog from '../common/CustomDialog';
import SuccessNotification from '../common/SuccessNotification';

const QuickInventoryDialog = ({ open, onClose, batch, productName, onUpdated }) => {
    const [addQty, setAddQty] = useState('');
    const [newCostPrice, setNewCostPrice] = useState('');
    const [isAveragingEnabled, setIsAveragingEnabled] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/settings');
                if (res.data.data.posEnableWeightedAverageCost) {
                    setIsAveragingEnabled(true);
                    setNewCostPrice(batch?.costPrice || '');
                } else {
                    setIsAveragingEnabled(false);
                }
            } catch (error) {
                console.error('Failed to fetch settings in QuickInventory:', error);
            }
        };
        if (open) {
            fetchSettings();
        }

        const handleSettingsUpdate = () => {
            if (open) fetchSettings();
        };

        window.addEventListener('pos-settings-updated', handleSettingsUpdate);
        return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdate);
    }, [open, batch]);

    const handleClose = () => {
        setAddQty('');
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!batch) return;

        const qtyToAdd = Number(addQty);
        if (!Number.isFinite(qtyToAdd) || qtyToAdd <= 0 || !Number.isInteger(qtyToAdd)) {
            setNotification({ open: true, message: 'Enter a positive whole number', severity: 'error' });
            return;
        }

        try {
            const nextQuantity = Number(batch.quantity || 0) + qtyToAdd;
            const updateData = { quantity: nextQuantity };

            if (isAveragingEnabled && newCostPrice) {
                const currentCost = Number(batch.costPrice || 0);
                const currentQty = Number(batch.quantity || 0);
                const addedCost = Number(newCostPrice);
                const averagedPrice = ((currentQty * currentCost) + (qtyToAdd * addedCost)) / nextQuantity;
                updateData.costPrice = Math.round(averagedPrice * 100) / 100;
            }

            await api.put(`/api/batches/${batch.id}`, updateData);
            setNotification({ open: true, message: 'Stock updated', severity: 'success' });
            if (onUpdated) onUpdated();

            // Allow notification to show before closing the dialog
            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to update batch stock:', error);
            setNotification({ open: true, message: 'Failed to update stock: ' + (error.response?.data?.error || error.message), severity: 'error' });
        }
    };

    const currentQty = Number(batch?.quantity || 0);
    const parsedAddQty = Number(addQty);
    const displayAddQty = Number.isFinite(parsedAddQty) && parsedAddQty > 0 ? parsedAddQty : 0;
    const previewQty = Number.isFinite(parsedAddQty) && parsedAddQty > 0
        ? currentQty + parsedAddQty
        : currentQty;

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
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth onKeyDown={handleKeyDown}>
                <DialogTitle>Quick Inventory</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {productName ? `${productName} - ` : ''}Batch {batch?.batchCode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Current stock: {currentQty}
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        type="number"
                        label="Add quantity"
                        value={addQty}
                        onChange={(event) => setAddQty(event.target.value)}
                        inputProps={{ min: 1, step: 1 }}
                        sx={{ mb: isAveragingEnabled ? 2 : 0 }}
                    />

                    {isAveragingEnabled && (
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
                            <Box
                                sx={{
                                    flex: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: 'grey.100',
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                    Current CP
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    ₹{batch?.costPrice || 0}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1.5 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="New CP"
                                    value={newCostPrice}
                                    onChange={(event) => setNewCostPrice(event.target.value)}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Box>
                        </Box>
                    )}

                    <Box
                        sx={{
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: 'rgba(25, 118, 210, 0.12)',
                            border: '1px solid rgba(25, 118, 210, 0.35)'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    New total
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    {previewQty}
                                </Typography>
                            </Box>
                            {isAveragingEnabled && addQty && newCostPrice && (
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Average Cost
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700 }}>
                                        ₹{(((currentQty * Number(batch?.costPrice || 0)) + (displayAddQty * Number(newCostPrice))) / (currentQty + displayAddQty)).toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Current {currentQty} + Added {displayAddQty}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} variant="outlined">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>
            <SuccessNotification
                open={notification.open}
                message={notification.message}
                severity={notification.severity}
                onClose={() => setNotification({ ...notification, open: false })}
                duration={3000}
            />
        </>
    );
};

export default QuickInventoryDialog;
