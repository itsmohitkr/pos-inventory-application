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
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

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
            await api.put(`/api/batches/${batch.id}`, {
                quantity: nextQuantity
            });
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
                    />
                    <Box
                        sx={{
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: 'rgba(25, 118, 210, 0.12)',
                            border: '1px solid rgba(25, 118, 210, 0.35)'
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            New total
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                            {previewQty}
                        </Typography>
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
