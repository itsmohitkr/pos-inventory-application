import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, TextField, Button, Box, Grid, Chip
} from '@mui/material';
import { Undo as ReturnIcon } from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

const RefundProcessor = ({ sale, onCancel, onRefundSuccess, hideHeaderFields }) => {
    const { dialogState, showError, showSuccess, showConfirm, closeDialog } = useCustomDialog();
    const [submitting, setSubmitting] = useState(false);
    const [selectedItems, setSelectedItems] = useState({});

    useEffect(() => {
        if (sale) {
            const initial = {};
            sale.items.forEach(item => {
                const maxReturn = item.quantity - (item.returnedQuantity || 0);
                initial[item.id] = {
                    checked: false,
                    quantity: maxReturn > 0 ? maxReturn : 1,
                    max: maxReturn
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

    const handleSelectAll = (event) => {
        const checked = event.target.checked;
        setSelectedItems(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(id => {
                if (next[id].max > 0) {
                    next[id].checked = checked;
                }
            });
            return next;
        });
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
        if (!confirmed) return;

        setSubmitting(true);
        try {
            await api.post(`/api/sale/${sale.id}/return`, { items: itemsToReturn });
            showSuccess("Refund processed successfully!");
            setSelectedItems({});
            if (onRefundSuccess) onRefundSuccess();
        } catch (err) {
            showError(err.response?.data?.error || "Failed to process refund");
        } finally {
            setSubmitting(false);
        }
    };

    if (!sale) return null;

    const allReturnableItems = Object.values(selectedItems).filter(item => item.max > 0);
    const checkedItemsCount = allReturnableItems.filter(item => item.checked).length;
    const isAllChecked = allReturnableItems.length > 0 && checkedItemsCount === allReturnableItems.length;
    const isIndeterminate = checkedItemsCount > 0 && checkedItemsCount < allReturnableItems.length;

    return (
        <Box display="flex" flexDirection="column" height="100%">
            {!hideHeaderFields && (
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
            )}

            <TableContainer sx={{ flexGrow: 1, maxHeight: 400, overflow: 'auto' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" width={80} sx={{ fontWeight: 'bold', py: 0.5, bgcolor: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Checkbox
                                        size="small"
                                        checked={isAllChecked}
                                        indeterminate={isIndeterminate}
                                        onChange={handleSelectAll}
                                        disabled={allReturnableItems.length === 0}
                                    />
                                    <Typography variant="caption" sx={{ fontSize: '10px', mt: -0.5, color: 'text.secondary' }}>ALL</Typography>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>Product</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>Sold Qty</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>Returned</TableCell>
                            <TableCell align="center" width={120} sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>Return Qty</TableCell>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {item.batch?.product?.name || item.productName}
                                                </Typography>
                                                {item.batch?.batchCode && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Batch: {item.batch.batchCode}
                                                    </Typography>
                                                )}
                                            </Box>
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
                                    <TableCell align="center" sx={{ color: 'error.main' }}>
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

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid #eee' }}>
                {onCancel && (
                    <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={processRefund}
                    variant="contained"
                    startIcon={<ReturnIcon />}
                    disabled={submitting}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: onCancel ? 2 : 6 }}
                >
                    {submitting ? "Processing..." : "Process Returns"}
                </Button>
            </Box>

            <CustomDialog {...dialogState} onClose={closeDialog} />
        </Box>
    );
};

export default RefundProcessor;
