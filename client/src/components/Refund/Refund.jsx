import React, { useState } from 'react';
import axios from 'axios';
import {
    Container, Typography, TextField, Button, Paper, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, IconButton, Alert, CircularProgress, Card, CardContent,
    Grid
} from '@mui/material';
import {
    Search as SearchIcon,
    Undo as ReturnIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

const Refund = () => {
    const { dialogState, showError, showSuccess, showConfirm, closeDialog } = useCustomDialog();
    const [orderId, setOrderId] = useState('');
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState({}); // { saleItemId: { checked: bool, quantity: num } }

    const fetchOrder = async () => {
        if (!orderId) return;
        setLoading(true);
        setError(null);
        setSale(null);
        setSelectedItems({});
        try {
            // Remove 'ORD-' prefix if entered
            const id = orderId.replace('ORD-', '');
            const res = await axios.get(`/api/sale/${id}`);
            setSale(res.data);

            // Initialize selected items
            const initial = {};
            res.data.items.forEach(item => {
                initial[item.id] = { checked: false, quantity: 1, max: item.quantity - item.returnedQuantity };
            });
            setSelectedItems(initial);
        } catch (err) {
            setError(err.response?.data?.error || "Order not found or an error occurred");
        } finally {
            setLoading(false);
        }
    };

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
            .filter(([id, data]) => data.checked)
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
            setSale(null);
            setOrderId('');
        } catch (err) {
            showError(err.response?.data?.error || "Failed to process refund");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: { xs: 3, md: 5 }, mb: 6 }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    mb: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)'
                }}
            >
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                    Process Refund / Return
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Search an order and choose items to return with confidence.
                </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Enter Order ID"
                        placeholder="e.g. ORD-5 or 5"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchOrder()}
                    />
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<SearchIcon />}
                        onClick={fetchOrder}
                        disabled={loading}
                        sx={{ px: 4 }}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {sale && (
                <Card elevation={0}>
                    <CardContent sx={{ p: 0 }}>
                        <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid rgba(16, 24, 40, 0.08)' }}>
                            <Grid container>
                                <Grid item xs={6}>
                                    <Typography variant="h6" fontWeight="bold">ORD-{sale.id}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Date: {new Date(sale.createdAt).toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} textAlign="right">
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                        Bill Total: ₹{sale.totalAmount.toFixed(2)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" width={60}>Return?</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Sold Qty</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Returned</TableCell>
                                        <TableCell align="center" width={120} sx={{ fontWeight: 'bold' }}>Return Qty</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sale.items.map((item) => {
                                        const alreadyReturned = item.returnedQuantity;
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
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {item.batch.product.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Batch: {item.batch.batchCode}
                                                    </Typography>
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
                                                        disabled={!selectedItems[item.id]?.checked}
                                                        InputProps={{ inputProps: { min: 1, max: canReturn } }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ p: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<ReturnIcon />}
                                onClick={processRefund}
                                disabled={submitting}
                                sx={{ height: 50, px: 6 }}
                            >
                                {submitting ? "Processing..." : "Process Selected Returns"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}
            <CustomDialog {...dialogState} onClose={closeDialog} />
        </Container>
    );
};

export default Refund;
