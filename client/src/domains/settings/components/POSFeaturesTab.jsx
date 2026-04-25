import React from 'react';
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
}) => {
    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    <FeaturesIcon fontSize="small" color="primary" />
                    POS Features
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={4}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                            Core Terminal Features
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Enable or disable specific features available directly on the POS transaction interface.
                        </Typography>

                        <Stack spacing={2.5}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={looseSaleEnabled}
                                        onChange={(e) => setLooseSaleEnabled(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            Loose Sale Button
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Enable the [F8] shortcut and button for items sold without a barcode (e.g., loose vegetables).
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={fullscreenEnabled}
                                        onChange={(e) => setFullscreenEnabled(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            Fullscreen Toggle
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Shows a fullscreen button in the bottom-left corner and enables browser-level fullscreen modes.
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={calculatorEnabled}
                                        onChange={(e) => setCalculatorEnabledState(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            On-Screen Calculator
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Displays a floating calculator button for quick mathematical operations during billing.
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={changeCalculatorEnabled}
                                        onChange={(e) => setChangeCalculatorEnabledState(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            Cash Change Calculator
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Automatically calculates the change to return based on the amount received from the customer.
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={paymentMethodsEnabled}
                                        onChange={(e) => setPaymentMethodsEnabledState(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            Payment Methods Selector
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Shows individual icons and buttons for Cash, UPI, Card, and other enabled payment methods.
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                            Inventory & Transactions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Configure backend behaviors for stock management and transaction-level input fields.
                        </Typography>

                        <Stack spacing={2.5}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={weightedAverageCostEnabled}
                                        onChange={(e) => setWeightedAverageCostEnabled(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            Weighted Average Cost (WAC)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Recalculates the Cost Price automatically when new stock is added with a different purchase cost.
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={extraDiscountEnabled}
                                        onChange={(e) => setExtraDiscountEnabledState(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            Manual Extra Discount
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Adds a text field in the checkout panel for manual fixed-amount discounts per bill.
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                            System Parameters
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Define global timeout values and UI display durations for the application.
                        </Typography>

                        <Stack spacing={3}>
                            <Box sx={{ ml: 1 }}>
                                <Typography variant="body1" fontWeight={600} gutterBottom>
                                    Notification Auto-Dismiss
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                    Duration (in seconds) for which success/error alerts remain visible on the screen.
                                </Typography>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={notificationDuration}
                                    onChange={(e) => setNotificationDurationState(parseFloat(e.target.value))}
                                    inputProps={{ min: 1, max: 10, step: 0.5 }}
                                    sx={{ maxWidth: 150 }}
                                />
                            </Box>

                            <Box sx={{ ml: 1 }}>
                                <Typography variant="body1" fontWeight={600} gutterBottom>
                                    Admin Session Timeout
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                    Time (in minutes) after which an elevated admin session automatically resets to salesman role.
                                </Typography>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={adminAutoLogoutTime}
                                    onChange={(e) => setAdminAutoLogoutTimeState(parseInt(e.target.value, 10))}
                                    inputProps={{ min: 1, max: 120, step: 1 }}
                                    sx={{ maxWidth: 150 }}
                                />
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
};

export default POSFeaturesTab;
