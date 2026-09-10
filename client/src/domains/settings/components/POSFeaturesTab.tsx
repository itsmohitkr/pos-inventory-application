import React from 'react';

/** Every POS feature toggle, each paired with its setter. */
interface POSFeaturesTabProps {
  looseSaleEnabled: boolean;
  setLooseSaleEnabled: (enabled: boolean) => void;
  fullscreenEnabled: boolean;
  setFullscreenEnabled: (enabled: boolean) => void;
  weightedAverageCostEnabled: boolean;
  setWeightedAverageCostEnabled: (enabled: boolean) => void;
  extraDiscountEnabled: boolean;
  setExtraDiscountEnabledState: (enabled: boolean) => void;
  /** Snackbar duration in milliseconds. */
  notificationDuration: number;
  setNotificationDurationState: (duration: number) => void;
  /** Minutes before an elevated admin session drops back down. */
  adminAutoLogoutTime: number;
  setAdminAutoLogoutTimeState: (minutes: number) => void;
  calculatorEnabled: boolean;
  setCalculatorEnabledState: (enabled: boolean) => void;
  changeCalculatorEnabled: boolean;
  setChangeCalculatorEnabledState: (enabled: boolean) => void;
  paymentMethodsEnabled: boolean;
  setPaymentMethodsEnabledState: (enabled: boolean) => void;
  customerFeatureEnabled: boolean;
  setCustomerFeatureEnabledState: (enabled: boolean) => void;
}
import {
    Box,
    Divider,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { FeaturedPlayList as FeaturesIcon } from '@mui/icons-material';

const POSFeaturesTab = ({
    looseSaleEnabled,
    setLooseSaleEnabled,
    fullscreenEnabled,
    setFullscreenEnabled,
    weightedAverageCostEnabled,
    setWeightedAverageCostEnabled,
    extraDiscountEnabled,
    setExtraDiscountEnabledState,
    notificationDuration,
    setNotificationDurationState,
    adminAutoLogoutTime,
    setAdminAutoLogoutTimeState,
    calculatorEnabled,
    setCalculatorEnabledState,
    changeCalculatorEnabled,
    setChangeCalculatorEnabledState,
    paymentMethodsEnabled,
    setPaymentMethodsEnabledState,
    customerFeatureEnabled,
    setCustomerFeatureEnabledState,
}: POSFeaturesTabProps) => {
    const renderFeatureRow = (
        label: string,
        description: string,
        checked: boolean,
        onChange: (checked: boolean) => void
    ) => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.75,
                borderRadius: '8px',
                border: '1px solid #edf2f7',
                bgcolor: checked ? 'rgba(11, 29, 57, 0.02)' : '#ffffff',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                    bgcolor: checked ? 'rgba(11, 29, 57, 0.04)' : '#f8fafc',
                    borderColor: '#cbd5e1',
                },
            }}
        >
            <Box sx={{ pr: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0b1d39', fontSize: '0.88rem' }}>
                    {label}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.76rem', display: 'block', mt: 0.25 }}>
                    {description}
                </Typography>
            </Box>
            <Switch
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                inputProps={{ 'aria-label': label }}
                sx={{
                    flexShrink: 0,
                    '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0b1d39',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: '#0b1d39 !important',
                    },
                }}
            />
        </Box>
    );

    return (
        <Box>
            {/* 1. Core Terminal Features Card */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    mb: 2.5,
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box
                        sx={{
                            p: 0.75,
                            borderRadius: '8px',
                            bgcolor: 'rgba(11, 29, 57, 0.08)',
                            color: '#0b1d39',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FeaturesIcon fontSize="small" />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}>
                            Core Terminal Features
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                            Enable or disable specific features available directly on the POS register
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

                <Stack spacing={1.25}>
                    {renderFeatureRow(
                        'Loose Sale Button',
                        'Enable the [F8] shortcut and button for items sold without a barcode (e.g., loose produce).',
                        looseSaleEnabled,
                        setLooseSaleEnabled
                    )}
                    {renderFeatureRow(
                        'Fullscreen Toggle',
                        'Show a fullscreen button in the bottom-left corner and support browser-level kiosk view.',
                        fullscreenEnabled,
                        setFullscreenEnabled
                    )}
                    {renderFeatureRow(
                        'On-Screen Calculator',
                        'Displays a floating calculator tool for quick mathematical operations during checkout.',
                        calculatorEnabled,
                        setCalculatorEnabledState
                    )}
                    {renderFeatureRow(
                        'Cash Change Calculator',
                        'Automatically calculates exact change to return based on customer tender amount.',
                        changeCalculatorEnabled,
                        setChangeCalculatorEnabledState
                    )}
                    {renderFeatureRow(
                        'Payment Methods Selector',
                        'Display quick selector buttons for Cash, UPI, Card, and other configured payment options.',
                        paymentMethodsEnabled,
                        setPaymentMethodsEnabledState
                    )}
                    {renderFeatureRow(
                        'Customer Linking',
                        'Search customers by name, mobile, or ID directly from POS to link purchases to customer accounts.',
                        customerFeatureEnabled,
                        setCustomerFeatureEnabledState
                    )}
                </Stack>
            </Paper>

            {/* 2. Inventory & Transactions Card */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    mb: 2.5,
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                }}
            >
                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}>
                        Inventory & Transactions
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                        Configure backend behaviors for stock calculation and checkout fields
                    </Typography>
                </Box>
                <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

                <Stack spacing={1.25}>
                    {renderFeatureRow(
                        'Weighted Average Cost (WAC)',
                        'Recalculates product Cost Price automatically when new inventory is received at different purchase costs.',
                        weightedAverageCostEnabled,
                        setWeightedAverageCostEnabled
                    )}
                    {renderFeatureRow(
                        'Manual Extra Discount',
                        'Adds a discount field in the checkout panel for manual fixed-amount discounts per transaction.',
                        extraDiscountEnabled,
                        setExtraDiscountEnabledState
                    )}
                </Stack>
            </Paper>

            {/* 3. System Parameters Card */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                }}
            >
                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}>
                        System Parameters
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                        Global timeout values, session durations, and UI alert timings
                    </Typography>
                </Box>
                <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#0b1d39', mb: 0.5 }}>
                            Notification Auto-Dismiss
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.76rem' }}>
                            Duration (in seconds) that toast alerts remain visible on screen.
                        </Typography>
                        <TextField
                            type="number"
                            size="small"
                            value={notificationDuration}
                            onChange={(e) => setNotificationDurationState(parseFloat(e.target.value))}
                            inputProps={{ min: 1, max: 10, step: 0.5 }}
                            sx={{ bgcolor: '#ffffff', maxWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#0b1d39', mb: 0.5 }}>
                            Admin Session Timeout
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.76rem' }}>
                            Minutes before an elevated admin session reverts to salesman role.
                        </Typography>
                        <TextField
                            type="number"
                            size="small"
                            value={adminAutoLogoutTime}
                            onChange={(e) => setAdminAutoLogoutTimeState(parseInt(e.target.value, 10))}
                            inputProps={{ min: 1, max: 120, step: 1 }}
                            sx={{ bgcolor: '#ffffff', maxWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default POSFeaturesTab;
