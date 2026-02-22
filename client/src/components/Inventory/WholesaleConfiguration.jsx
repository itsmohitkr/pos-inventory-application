import React from 'react';
import { Grid, TextField, InputAdornment, Box, Typography, FormControlLabel, Switch, Divider } from '@mui/material';

const WholesaleConfiguration = ({
    wholesaleEnabled,
    onToggleChange,
    wholesalePrice,
    onPriceChange,
    wholesaleMinQty,
    onMinQtyChange,
    sellingPrice = 0,
    costPrice = 0
}) => {
    const sPrice = Number(sellingPrice) || 0;
    const cPrice = Number(costPrice) || 0;
    const wPrice = Number(wholesalePrice) || 0;

    const wholesaleSavings = sPrice > 0 ? sPrice - wPrice : 0;
    const wholesalePricePercent = sPrice > 0 ? (wholesaleSavings / sPrice) * 100 : 0;
    const wholesaleMarginValue = wPrice - cPrice;
    const wholesaleMarginPercent = wPrice > 0 ? (wholesaleMarginValue / wPrice) * 100 : 0;

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                    control={
                        <Switch
                            checked={wholesaleEnabled}
                            onChange={(e) => onToggleChange(e.target.checked)}
                        />
                    }
                    label={<Typography variant="subtitle2" fontWeight={600}>Enable Wholesale Pricing</Typography>}
                />
            </Grid>

            {wholesaleEnabled && (
                <>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Wholesale Price"
                            value={wholesalePrice}
                            onChange={(e) => onPriceChange(e.target.value)}
                            placeholder="0.00"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                inputProps: { min: 0, step: '0.01' }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Min. Quantity"
                            value={wholesaleMinQty}
                            onChange={(e) => onMinQtyChange(e.target.value)}
                            placeholder="10"
                            InputProps={{ inputProps: { min: 1, step: 1 } }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(2, 132, 199, 0.04)', border: '1px dashed rgba(2, 132, 199, 0.2)' }}>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Savings vs Retail</Typography>
                                    <Typography variant="subtitle2" color="primary.main" fontWeight={700}>₹{wholesaleSavings.toFixed(2)} ({wholesalePricePercent.toFixed(1)}% less)</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Wholesale Margin</Typography>
                                    <Typography variant="subtitle2" color={wholesaleMarginPercent > 0 ? "success.main" : "error.main"} fontWeight={700}>{wholesaleMarginPercent.toFixed(1)}%</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </>
            )}
        </Grid>
    );
};

export default WholesaleConfiguration;
