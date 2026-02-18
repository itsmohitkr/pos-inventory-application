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
    extraDiscountEnabled,
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
                height: { xs: 'auto', lg: '100%' },
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 1.5,
                    color: 'primary.contrastText',
                    background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)'
                }}
            >
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon fontSize="small" /> Checkout
                </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ p: 1.5, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Stats - Compact Single Row */}
                <Paper elevation={0} sx={{ p: 1, bgcolor: 'background.default', display: 'flex', justifyContent: 'space-around' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>ITEMS</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">{cart.length}</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>QTY</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">{totalQty}</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center', border: '1px dashed rgba(242, 181, 68, 0.6)', borderRadius: 1, px: 1, py: 0.5, bgcolor: 'rgba(242, 181, 68, 0.08)' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#b76e00', fontWeight: 700 }}>Customer Savings</Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#b76e00' }}>₹{totalSavings.toFixed(0)}</Typography>
                    </Box>
                </Paper>

                {/* Discount Field - Compact - Conditionally shown */}
                {extraDiscountEnabled && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
                            Extra Discount
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            variant="outlined"
                            size="small"
                            placeholder="0.00"
                            value={discount > 0 ? discount : ''}
                            onChange={(e) => onDiscountChange(Number(e.target.value))}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Typography color="text.secondary" variant="body2">₹</Typography></InputAdornment>,
                                sx: { fontSize: '0.875rem' }
                            }}
                        />
                    </Box>
                )}

                {/* Price Breakdown */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body1" color="text.secondary" fontWeight="bold">Subtotal</Typography>
                        <Typography variant="body1" fontWeight="bold">₹{subTotal.toFixed(2)}</Typography>
                    </Box>
                    {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body1" color="error.main" fontWeight="bold">Discount</Typography>
                            <Typography variant="body1" color="error.main" fontWeight="bold">- ₹{discount.toFixed(2)}</Typography>
                        </Box>
                    )}
                </Box>

                {/* Net Payable - More Compact */}
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'rgba(31, 138, 91, 0.12)', border: '1px solid rgba(31, 138, 91, 0.2)', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>NET PAYABLE</Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.dark" sx={{ letterSpacing: -0.5 }}>
                        ₹{totalAmount.toFixed(2)}
                    </Typography>
                </Paper>
            </Box>

            {/* Actions Footer - Fixed at bottom */}
            <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderTop: '1px solid rgba(16, 24, 40, 0.08)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Payment Methods Section - Compact */}
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                        PAYMENT METHOD
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 }}>
                        {getAvailablePaymentMethods().map((method) => (
                            <Button
                                key={method.id}
                                variant={selectedPaymentMethod?.id === method.id ? 'contained' : 'outlined'}
                                color={selectedPaymentMethod?.id === method.id ? 'primary' : 'inherit'}
                                className="pos-action-btn"
                                onClick={() => onSelectPaymentMethod(method)}
                                size="large"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    py: 1.5,
                                    px: 1,
                                    fontSize: '1rem',
                                    minHeight: 56,
                                    width: '100%',
                                    lineHeight: 1.2,
                                    textAlign: 'center',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    border: '1px solid rgba(16, 24, 40, 0.12)',
                                    borderColor: selectedPaymentMethod?.id === method.id ? 'primary.main' : 'rgba(16, 24, 40, 0.12)',
                                    bgcolor: selectedPaymentMethod?.id === method.id ? 'primary.light' : 'action.hover',
                                    color: selectedPaymentMethod?.id === method.id ? 'primary.contrastText' : 'text.primary',
                                    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                                    '&:hover': {
                                        bgcolor: selectedPaymentMethod?.id === method.id ? 'primary.main' : 'primary.light',
                                        color: 'primary.contrastText',
                                        borderColor: 'primary.main'
                                    }
                                }}
                            >
                                {method.label}
                            </Button>
                        ))}
                    </Box>
                    {cart.length > 0 && !selectedPaymentMethod && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                            Please select a payment method
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Action Buttons - Compact */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="large"
                        className="pos-action-btn"
                        onClick={onPay}
                        disabled={cart.length === 0 || !selectedPaymentMethod}
                        startIcon={<CheckCircleIcon />}
                        sx={{
                            height: 64,
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                            bgcolor: 'success.light',
                            color: 'success.contrastText',
                            transition: 'background 0.2s, color 0.2s',
                            '&:hover': {
                                bgcolor: 'success.main',
                                color: 'success.contrastText'
                            }
                        }}
                    >
                        Pay
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color="info"
                        size="large"
                        className="pos-action-btn"
                        onClick={onPayAndPrint}
                        disabled={cart.length === 0 || !selectedPaymentMethod}
                        startIcon={<PrintIcon />}
                        sx={{
                            height: 64,
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                            bgcolor: 'info.light',
                            color: 'info.contrastText',
                            transition: 'background 0.2s, color 0.2s',
                            '&:hover': {
                                bgcolor: 'info.main',
                                color: 'info.contrastText'
                            }
                        }}
                    >
                        Pay & Print
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="warning"
                        size="large"
                        className="pos-action-btn"
                        onClick={onRefund}
                        startIcon={<ReplayIcon />}
                        sx={{
                            height: 64,
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                            bgcolor: 'warning.light',
                            color: 'warning.contrastText',
                            transition: 'background 0.2s, color 0.2s',
                            '&:hover': {
                                bgcolor: 'warning.main',
                                color: 'warning.contrastText'
                            }
                        }}
                    >
                        Refund
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="large"
                        className="pos-action-btn"
                        onClick={onVoid}
                        disabled={cart.length === 0}
                        sx={{
                            height: 64,
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                            transition: 'background 0.2s, color 0.2s',
                            '&:hover': {
                                bgcolor: 'error.main',
                                color: 'error.contrastText'
                            }
                        }}
                    >
                        Void Order
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default TransactionPanel;
