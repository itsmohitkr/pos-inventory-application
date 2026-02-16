import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Stack,
    FormControlLabel,
    Checkbox,
    TextField,
    Button,
    Box,
    Chip,
    Divider,
    FormGroup,
    Alert
} from '@mui/material';
import {
    Payment as PaymentIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { getStoredPaymentSettings, STORAGE_KEYS, getFullscreenEnabled } from '../../utils/paymentSettings';

const PAYMENT_METHOD_OPTIONS = [
    { id: 'cash', label: 'Cash', icon: '💵' },
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'card', label: 'Card', icon: '💳' },
    { id: 'wallet', label: 'Digital Wallet', icon: '💰' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { id: 'cheque', label: 'Cheque', icon: '📄' }
];

const PaymentSettingsPanel = () => {
    const [paymentSettings, setPaymentSettings] = useState(getStoredPaymentSettings);
    const [enableFullscreen, setEnableFullscreen] = useState(getFullscreenEnabled);
    const [customMethod, setCustomMethod] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const handlePaymentMethodToggle = (methodId) => {
        setPaymentSettings(prev => {
            const updated = {
                ...prev,
                enabledMethods: prev.enabledMethods.includes(methodId)
                    ? prev.enabledMethods.filter(m => m !== methodId)
                    : [...prev.enabledMethods, methodId]
            };
            saveSettings(updated);
            return updated;
        });
    };

    const handleAddCustomMethod = () => {
        if (customMethod.trim()) {
            setPaymentSettings(prev => {
                const updated = {
                    ...prev,
                    customMethods: [...prev.customMethods, { id: `custom_${Date.now()}`, label: customMethod }]
                };
                saveSettings(updated);
                return updated;
            });
            setCustomMethod('');
            setShowCustomInput(false);
        }
    };

    const handleRemoveCustomMethod = (methodId) => {
        setPaymentSettings(prev => {
            const updated = {
                ...prev,
                customMethods: prev.customMethods.filter(m => m.id !== methodId)
            };
            saveSettings(updated);
            return updated;
        });
    };

    const handleEnableFullscreen = (enabled) => {
        setEnableFullscreen(enabled);
        localStorage.setItem(STORAGE_KEYS.enableFullscreen, JSON.stringify(enabled));
        window.dispatchEvent(new Event('pos-settings-updated'));
    };

    const handleMultiplePaymentToggle = () => {
        setPaymentSettings(prev => {
            const updated = {
                ...prev,
                allowMultplePayment: !prev.allowMultplePayment
            };
            saveSettings(updated);
            return updated;
        });
    };

    const saveSettings = (settings) => {
        localStorage.setItem(STORAGE_KEYS.paymentSettings, JSON.stringify(settings));
        window.dispatchEvent(new Event('pos-settings-updated'));
    };

    const enabledCount = paymentSettings.enabledMethods.length;

    return (
        <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <PaymentIcon sx={{ fontSize: 28, color: '#1f8a5b' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Payment Settings
                </Typography>
            </Box>

            <Stack spacing={3}>
                {/* Enabled Payment Methods */}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Payment Methods
                        <Chip 
                            label={`${enabledCount} enabled`} 
                            size="small" 
                            color={enabledCount > 0 ? 'success' : 'error'}
                            variant="outlined"
                        />
                    </Typography>
                    <FormGroup>
                        {PAYMENT_METHOD_OPTIONS.map(method => (
                            <FormControlLabel
                                key={method.id}
                                control={
                                    <Checkbox
                                        checked={paymentSettings.enabledMethods.includes(method.id)}
                                        onChange={() => handlePaymentMethodToggle(method.id)}
                                    />
                                }
                                label={`${method.icon} ${method.label}`}
                            />
                        ))}
                    </FormGroup>
                </Box>

                {/* Custom Payment Methods */}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Custom Payment Methods
                    </Typography>
                    {paymentSettings.customMethods.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {paymentSettings.customMethods.map(method => (
                                <Chip
                                    key={method.id}
                                    label={method.label}
                                    onDelete={() => handleRemoveCustomMethod(method.id)}
                                    deleteIcon={<DeleteIcon />}
                                    sx={{ bgcolor: '#e8f5e9', color: '#1f8a5b' }}
                                />
                            ))}
                        </Box>
                    )}
                    {!showCustomInput ? (
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={() => setShowCustomInput(true)}
                        >
                            Add Custom Method
                        </Button>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                placeholder="Enter payment method name"
                                value={customMethod}
                                onChange={(e) => setCustomMethod(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleAddCustomMethod();
                                }}
                                autoFocus
                                sx={{ flex: 1 }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleAddCustomMethod}
                                disabled={!customMethod.trim()}
                            >
                                Add
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setShowCustomInput(false);
                                    setCustomMethod('');
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    )}
                </Box>

                <Divider />

                {/* Additional Options */}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                        Payment Options
                    </Typography>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={paymentSettings.allowMultplePayment}
                                    onChange={handleMultiplePaymentToggle}
                                />
                            }
                            label="Allow Multiple Payment Methods in Single Transaction"
                        />
                    </FormGroup>
                </Box>

                <Divider />

                {/* Fullscreen Toggle */}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                        UI Settings
                    </Typography>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={enableFullscreen}
                                    onChange={(e) => handleEnableFullscreen(e.target.checked)}
                                />
                            }
                            label="Enable Fullscreen Toggle Button"
                        />
                    </FormGroup>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                        Shows a fullscreen button in the bottom-left corner of the POS screen
                    </Typography>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                    Changes are saved automatically and will take effect immediately on the POS screen.
                </Alert>
            </Stack>
        </Paper>
    );
};

export default PaymentSettingsPanel;
