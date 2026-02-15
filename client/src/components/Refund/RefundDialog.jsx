import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, TextField, Button, Box, Alert, CircularProgress, Grid,
    IconButton, Chip
} from '@mui/material';
import {
    Undo as ReturnIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

const RefundDialog = ({ open, onClose, sale, onRefundSuccess }) => {
    const { dialogState, showError, showSuccess, showConfirm, closeDialog } = useCustomDialog();
    const [submitting, setSubmitting] = useState(false);
    const [selectedItems, setSelectedItems] = useState({}); // { saleItemId: { checked: bool, quantity: num } }

    // Initialize selected items when sale changes
    useEffect(() => {
        if (sale) {
            const initial = {};
            sale.items.forEach(item => {
                initial[item.id] = { 
                    checked: false, 
                    quantity: 1, 
                    max: item.quantity - (item.returnedQuantity || 0) 
                };
            });
            setSelectedItems(initial);
        }
    }, [sale]);

    const handleCheckChange = (id) => {
        setSelectedItems(prev => ({
            ...prev,
            [id]: { ...prev[id], checked: !prev[id].checked }
        }));
    };

    const handleQuantityChange = (id, val) => {
        const qty = parseInt(val);
        const max = selectedItems[id].max;
        if (qty > max) return;
        if (qty < 1) return;

        setSelectedItems(prev => ({
            ...prev,
            [id]: { ...prev[id], quantity: qty }
        }));
    };

    const processRefund = async () => {
        const itemsToReturn = Object.entries(selectedItems)
            .filter(([, data]) => data.checked)
            .map(([id, data]) => ({
                saleItemId: parseInt(id),
                quantity: data.quantity
            }));

        if (itemsToReturn.length === 0) {
            showError("Please select at least one item to return");
            return;
        }

        const confirmed = await showConfirm(`Are you sure you want to process this refund? Items will be returned to inventory.`);
        if (!confirmed) {
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`/api/sale/${sale.id}/return`, { items: itemsToReturn });
            showSuccess("Refund processed successfully!");
            setSelectedItems({});
            // Call the callback to refresh the sales list
            if (onRefundSuccess) {
                onRefundSuccess();
            }
            onClose();
        } catch (err) {
            showError(err.response?.data?.error || "Failed to process refund");
        } finally {
            setSubmitting(false);
        }
    };

    if (!sale) return null;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Process Refund / Return - ORD-{sale.id}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0 }}>
                    <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid rgba(16, 24, 40, 0.08)' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    ORDER DATE
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {new Date(sale.createdAt).toLocaleString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} textAlign="right">
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    BILL TOTAL
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                    ₹{(sale.totalAmount + sale.discount).toFixed(2)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" width={60} sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Return?</TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Product</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Sold Qty</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Returned</TableCell>
                                    <TableCell align="center" width={120} sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Return Qty</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sale.items.map((item) => {
                                    const alreadyReturned = item.returnedQuantity || 0;
                                    const canReturn = item.quantity - alreadyReturned;

                                    return (
                                        <TableRow key={item.id} hover>
                                            <TableCell align="center">
                                                <Checkbox
                                                    checked={selectedItems[item.id]?.checked || false}
                                                    onChange={() => handleCheckChange(item.id)}
                                                    disabled={canReturn === 0}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {item.productName}
                                                    </Typography>
                                                    {alreadyReturned > 0 && (
                                                        <Chip
                                                            label={alreadyReturned === item.quantity ? 'Refunded' : 'Returned'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alreadyReturned === item.quantity ? '#ffebee' : '#e8f5e9',
                                                                color: alreadyReturned === item.quantity ? '#d32f2f' : '#2e7d32',
                                                                fontWeight: 700,
                                                                fontSize: '0.65rem'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="center" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                                                {alreadyReturned}
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={selectedItems[item.id]?.quantity || 1}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    disabled={!selectedItems[item.id]?.checked || canReturn === 0}
                                                    InputProps={{ inputProps: { min: 1, max: canReturn } }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={processRefund}
                        variant="contained"
                        startIcon={<ReturnIcon />}
                        disabled={submitting}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        {submitting ? "Processing..." : "Process Returns"}
                    </Button>
                </DialogActions>
            </Dialog>

            <CustomDialog {...dialogState} onClose={closeDialog} />
        </>
    );
};

export default RefundDialog;
