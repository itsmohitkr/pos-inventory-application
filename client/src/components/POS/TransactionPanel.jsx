import React from 'react';
import {
    Box, Typography, Grid, Paper, Divider, TextField, InputAdornment, Button, Chip
} from '@mui/material';
import {
    ReceiptLong as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Replay as ReplayIcon,
    Print as PrintIcon,
    Payment as PaymentIcon,
    Edit as EditIcon
} from '@mui/icons-material';

const TransactionPanel = ({
    cart,
    discount,
    onDiscountChange,
    onVoid,
    onCheckout,
    onCheckoutAndPrint,
    onRefund,
    onSelectPaymentMethod,
    selectedPayment,
    subTotal,
    totalMrp,
    totalQty,
    totalAmount,
    totalSavings
}) => {
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
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid rgba(16, 24, 40, 0.08)' }}>
                {/* Payment Method Selection */}
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.05)', borderRadius: 1, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">PAYMENT METHOD</Typography>
                        {selectedPayment && (
                            <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={onSelectPaymentMethod}
                                variant="text"
                                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            >
                                Change
                            </Button>
                        )}
                    </Box>
                    {selectedPayment ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {selectedPayment.methods.map((method, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip
                                        label={`${method.label} ${selectedPayment.methods.length > 1 ? `(₹${method.amount?.toFixed(2) || totalAmount.toFixed(2)})` : ''}`}
                                        size="small"
                                        variant="filled"
                                        color="primary"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    {selectedPayment.methods.length > 1 && idx < selectedPayment.methods.length - 1 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>+</Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Button
                            fullWidth
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={onSelectPaymentMethod}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Select Payment Method
                        </Button>
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
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={onCheckout}
                            disabled={cart.length === 0 || !selectedPayment}
                            startIcon={<CheckCircleIcon />}
                            sx={{ height: 50, fontSize: '1rem', fontWeight: 'bold' }}
                        >
                            Accept Payment
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="info"
                            size="large"
                            onClick={onCheckoutAndPrint}
                            disabled={cart.length === 0 || !selectedPayment}
                            startIcon={<PrintIcon />}
                            sx={{ height: 50, fontSize: '1rem', fontWeight: 'bold' }}
                        >
                            Accept Payment & Print Receipt
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default TransactionPanel;
