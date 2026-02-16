import React from 'react';
import {
    Box, Typography, Grid, Paper, Divider, TextField, InputAdornment, Button, Stack
} from '@mui/material';
import {
    ReceiptLong as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Replay as ReplayIcon,
    Print as PrintIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';

const PAYMENT_METHOD_OPTIONS = {
    cash: { label: 'Cash', color: '#16a34a' },
    upi: { label: 'UPI', color: '#0369a1' },
    card: { label: 'Card', color: '#7c3aed' },
    wallet: { label: 'Digital Wallet', color: '#ea580c' },
    bank_transfer: { label: 'Bank Transfer', color: '#0891b2' },
    cheque: { label: 'Cheque', color: '#64748b' }
};

const TransactionPanel = ({
    cart,
    discount,
    onDiscountChange,
    onVoid,
    onPay,
    onPayAndPrint,
    onRefund,
    onSelectPaymentMethod,
    selectedPaymentMethod,
    paymentSettings,
    subTotal,
    totalMrp,
    totalQty,
    totalAmount,
    totalSavings
}) => {
    const getAvailablePaymentMethods = () => {
        const enabled = paymentSettings?.enabledMethods || [];
        const custom = paymentSettings?.customMethods || [];
        
        const methods = Object.entries(PAYMENT_METHOD_OPTIONS)
            .filter(([id]) => enabled.includes(id))
            .map(([id, config]) => ({ id, ...config }));
        
        custom.forEach(m => {
            methods.push({
                id: m.id,
                label: m.label,
                color: '#64748b'
            });
        });
        
        return methods;
    };
    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: { xs: 'auto', lg: '100%' },
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2.5,
                    color: 'primary.contrastText',
                    background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)'
                }}
            >
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon /> Checkout
                </Typography>
            </Box>

            {/* Stats */}
            <Box sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto' }}>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">ITEMS</Typography>
                            <Typography variant="h5" fontWeight="bold" color="primary">{cart.length}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL QTY</Typography>
                            <Typography variant="h5" fontWeight="bold" color="primary">{totalQty}</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">APPLY EXTRA DISCOUNT (₹)</Typography>
                    <TextField
                        fullWidth
                        type="number"
                        variant="outlined"
                        size="small"
                        placeholder="0.00"
                        value={discount > 0 ? discount : ''}
                        onChange={(e) => onDiscountChange(Number(e.target.value))}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Typography color="text.secondary">₹</Typography></InputAdornment>,
                            sx: { fontWeight: 'bold' }
                        }}
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Cart Subtotal</Typography>
                    <Typography variant="body2" fontWeight="bold">₹{subTotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="error.main">Extra Discount</Typography>
                    <Typography variant="body2" color="error.main">- ₹{discount.toFixed(2)}</Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(242, 181, 68, 0.12)', border: '1px dashed rgba(242, 181, 68, 0.6)', borderRadius: 1.5, my: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="#b76e00" fontWeight="bold">Customer Savings</Typography>
                        <Typography variant="h6" color="#b76e00" fontWeight="bold">₹{totalSavings.toFixed(2)}</Typography>
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(31, 138, 91, 0.12)', border: '1px solid rgba(31, 138, 91, 0.2)', borderRadius: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="success.main" fontWeight="bold">NET PAYABLE</Typography>
                    <Typography variant="h3" fontWeight="bold" color="success.dark" sx={{ letterSpacing: -1 }}>
                        ₹{totalAmount.toFixed(2)}
                    </Typography>
                </Paper>
            </Box>

            {/* Actions Footer - Fixed at bottom */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid rgba(16, 24, 40, 0.08)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Payment Methods Section */}
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ display: 'block', mb: 1 }}>
                        SELECT PAYMENT METHOD
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                        {getAvailablePaymentMethods().map((method) => (
                            <Button
                                key={method.id}
                                variant={selectedPaymentMethod?.id === method.id ? 'contained' : 'outlined'}
                                color={selectedPaymentMethod?.id === method.id ? 'primary' : 'inherit'}
                                onClick={() => onSelectPaymentMethod(method)}
                                size="small"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    py: 0.8,
                                    px: 1.5,
                                    border: '1px solid rgba(16, 24, 40, 0.12)',
                                    borderColor: selectedPaymentMethod?.id === method.id ? 'primary.main' : 'rgba(16, 24, 40, 0.12)',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: selectedPaymentMethod?.id === method.id ? 'primary.main' : 'action.hover'
                                    }
                                }}
                            >
                                {method.label}
                            </Button>
                        ))}
                    </Stack>
                    {!selectedPaymentMethod && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                            Please select a payment method
                        </Typography>
                    )}
                </Box>

                <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="warning"
                            size="large"
                            onClick={onRefund}
                            startIcon={<ReplayIcon />}
                            sx={{ height: 48, fontWeight: 'bold' }}
                        >
                            Refund
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            size="large"
                            onClick={onVoid}
                            disabled={cart.length === 0}
                            sx={{ height: 48, fontWeight: 'bold' }}
                        >
                            Void
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={onPay}
                            disabled={cart.length === 0 || !selectedPaymentMethod}
                            startIcon={<CheckCircleIcon />}
                            sx={{ height: 50, fontWeight: 'bold' }}
                        >
                            Pay
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="info"
                            size="large"
                            onClick={onPayAndPrint}
                            disabled={cart.length === 0 || !selectedPaymentMethod}
                            startIcon={<PrintIcon />}
                            sx={{ height: 50, fontWeight: 'bold' }}
                        >
                            Pay & Print
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default TransactionPanel;
