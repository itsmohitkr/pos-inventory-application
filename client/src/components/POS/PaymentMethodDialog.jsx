import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Divider,
    Stack
} from '@mui/material';
import { getStoredPaymentSettings } from '../../utils/paymentSettings';

const PAYMENT_METHOD_OPTIONS = {
    cash: { label: 'Cash', icon: '💵', color: '#16a34a' },
    upi: { label: 'UPI', icon: '📱', color: '#0369a1' },
    card: { label: 'Card', icon: '💳', color: '#7c3aed' },
    wallet: { label: 'Digital Wallet', icon: '💰', color: '#ea580c' },
    bank_transfer: { label: 'Bank Transfer', icon: '🏦', color: '#0891b2' },
    cheque: { label: 'Cheque', icon: '📄', color: '#64748b' }
};

const PaymentMethodDialog = ({ 
    open, 
    onClose, 
    totalAmount, 
    onConfirm, 
    allowMultiple = false 
}) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [selectedMethods, setSelectedMethods] = useState([]);
    const [reference, setReference] = useState('');
    const [showReferenceInput, setShowReferenceInput] = useState(false);

    const settings = getStoredPaymentSettings();

    const availableMethods = [
        ...Object.entries(PAYMENT_METHOD_OPTIONS)
            .filter(([id]) => settings.enabledMethods.includes(id))
            .map(([id, config]) => ({ id, ...config })),
        ...settings.customMethods.map(m => ({ 
            id: m.id, 
            label: m.label, 
            icon: '💳', 
            color: '#64748b' 
        }))
    ];

    const handleSelectMethod = (methodId) => {
        if (allowMultiple) {
            if (selectedMethods.includes(methodId)) {
                setSelectedMethods(selectedMethods.filter(m => m !== methodId));
            } else {
                setSelectedMethods([...selectedMethods, methodId]);
            }
        } else {
            setSelectedMethod(methodId);
            setShowReferenceInput(['upi', 'bank_transfer', 'card'].includes(methodId));
        }
    };

    const handleConfirm = () => {
        const methods = allowMultiple ? selectedMethods : [selectedMethod];
        
        if (!methods.length) return;

        const methodDetails = {
            methods: methods.map(m => {
                const method = availableMethods.find(x => x.id === m);
                return {
                    id: m,
                    label: method?.label || m,
                    amount: totalAmount / methods.length,
                    reference: methods.length === 1 ? reference : ''
                };
            }),
            totalAmount
        };

        onConfirm(methodDetails);
    };

    const selectedMethodObj = selectedMethod 
        ? availableMethods.find(m => m.id === selectedMethod)
        : null;

    const totalSelected = allowMultiple ? selectedMethods.length : (selectedMethod ? 1 : 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                Select Payment Method
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2}>
                    {/* Amount Display */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            bgcolor: 'rgba(31, 138, 91, 0.1)',
                            border: '2px solid rgba(31, 138, 91, 0.3)',
                            textAlign: 'center',
                            borderRadius: 1.5
                        }}
                    >
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Total Amount
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '1.8rem',
                                fontWeight: 700,
                                color: '#1f8a5b'
                            }}
                        >
                            ₹{totalAmount.toFixed(2)}
                        </Typography>
                    </Paper>

                    <Divider />

                    {/* Payment Methods Grid */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                            Choose Payment Method
                        </Typography>
                        <Grid container spacing={1.5}>
                            {availableMethods.map(method => (
                                <Grid item xs={6} key={method.id}>
                                    <Paper
                                        elevation={0}
                                        onClick={() => handleSelectMethod(method.id)}
                                        sx={{
                                            p: 2.5,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            border: '2px solid',
                                            borderColor: allowMultiple
                                                ? selectedMethods.includes(method.id)
                                                    ? method.color || '#1f8a5b'
                                                    : '#e2e8f0'
                                                : selectedMethod === method.id
                                                    ? method.color || '#1f8a5b'
                                                    : '#e2e8f0',
                                            bgcolor: allowMultiple
                                                ? selectedMethods.includes(method.id)
                                                    ? `${method.color}15`
                                                    : 'white'
                                                : selectedMethod === method.id
                                                    ? `${method.color}15`
                                                    : '#f8fafc',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: method.color || '#1f8a5b',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '2rem', mb: 1 }}>
                                            {method.icon}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: allowMultiple
                                                    ? selectedMethods.includes(method.id)
                                                        ? method.color || '#1f8a5b'
                                                        : '#64748b'
                                                    : selectedMethod === method.id
                                                        ? method.color || '#1f8a5b'
                                                        : '#64748b'
                                            }}
                                        >
                                            {method.label}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Reference Input for specific methods */}
                    {showReferenceInput && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    {selectedMethodObj?.label === 'UPI' && 'UPI Transaction ID'}
                                    {selectedMethodObj?.label === 'Card' && 'Card Reference Number'}
                                    {selectedMethodObj?.label === 'Bank Transfer' && 'Reference Number'}
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter reference number (optional)"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                />
                            </Box>
                        </>
                    )}

                    {/* Multiple Payment Info */}
                    {allowMultiple && totalSelected > 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: 1
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#0369a1' }}>
                                {totalSelected} method{totalSelected !== 1 ? 's' : ''} selected
                                {totalSelected > 0 && ` • ₹${(totalAmount / totalSelected).toFixed(2)} each`}
                            </Typography>
                        </Paper>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={allowMultiple ? selectedMethods.length === 0 : !selectedMethod}
                    sx={{
                        bgcolor: selectedMethodObj?.color || '#1f8a5b',
                        '&:hover': {
                            bgcolor: selectedMethodObj?.color || '#1f8a5b',
                            opacity: 0.9
                        }
                    }}
                >
                    Confirm Payment
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentMethodDialog;
