import React from 'react';
import {
    Box, Typography, Grid, Paper, Button, CircularProgress, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    TrendingUp as SalesIcon,
    Savings as ProfitIcon,
    ListAlt as OrdersIcon,
    DateRange as DateIcon,
    BarChart as MarginIcon,
    LocalShipping as ShippingIcon
} from '@mui/icons-material';
import StatCard from './StatCard';

const AnalyticsPanel = ({
    reportData,
    loading
}) => {
    const [ownerSharePercent, setOwnerSharePercent] = React.useState(50);

    const totalSales = reportData?.totalSales || 0;
    const totalProfit = reportData?.totalProfit || 0;
    const netProfit = reportData?.netProfit || 0;
    const totalPurchases = reportData?.totalPurchases || 0;
    const totalCashBalance = reportData?.totalCashBalance || 0;
    const ownerPayout = (netProfit * ownerSharePercent) / 100;

    // Group expenses by category
    const expenseBreakdown = (reportData?.expenses || []).reduce((acc, exp) => {
        const cat = exp.category || 'Misc';
        acc[cat] = (acc[cat] || 0) + exp.amount;
        return acc;
    }, {});

    // Group purchases by vendor
    const purchaseBreakdown = (reportData?.purchases || []).reduce((acc, pur) => {
        const vendor = pur.vendor || 'Unknown Vendor';
        acc[vendor] = (acc[vendor] || 0) + pur.totalAmount;
        return acc;
    }, {});

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#fcfcfc', p: 4, display: 'flex', flexDirection: 'column', gap: 4, height: '100%', overflowY: 'auto', borderRadius: 1 }}>
            {/* Cash Flow Statement Table */}
            <Box>
                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}>
                    CASH FLOW STATEMENT (CHRONOLOGICAL)
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PARTICULARS</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>AMOUNT (₹)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* 1. Total Sales */}
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                    Total Sales (Gross Income)
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#16a34a' }}>
                                    + {totalSales.toLocaleString()}
                                </TableCell>
                            </TableRow>

                            {/* 2. Detailed Expenses */}
                            {Object.entries(expenseBreakdown).map(([cat, amount]) => (
                                <TableRow key={cat}>
                                    <TableCell sx={{ color: '#64748b', pl: 4 }}>
                                        Less: Expenses ({cat})
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#dc2626' }}>
                                        - {amount.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* 3. Detailed Inventory Purchases */}
                            {Object.entries(purchaseBreakdown).map(([vendor, amount]) => (
                                <TableRow key={vendor}>
                                    <TableCell sx={{ color: '#64748b', pl: 4 }}>
                                        Less: Inventory Purchases ({vendor})
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#dc2626' }}>
                                        - {amount.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* 4. Final Cash Balance */}
                            <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                                <TableCell sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#166534' }}>
                                    TOTAL MONEY IN SHOP (NET BALANCE)
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#166534' }}>
                                    ₹ {totalCashBalance.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Payout Planning Section */}
            <Box>
                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}>
                    PROFIT & TAKEOUT CALCULATION
                </Typography>
                <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#f8fafc' }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                                    NET PROFIT (GROSS PROFIT - EXPENSES)
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
                                    ₹ {totalProfit.toLocaleString()}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontWeight: 700, textAlign: 'center' }}>
                                TAKEOUT PERCENTAGE (%)
                            </Typography>
                            <TextField
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={ownerSharePercent}
                                onChange={(e) => setOwnerSharePercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                InputProps={{
                                    sx: { bgcolor: '#fff', borderRadius: 2, fontWeight: 800, textAlign: 'center' }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, display: 'block' }}>
                                    MY PAYOUT ({ownerSharePercent}%)
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#2e7d32' }}>
                                    ₹ {ownerPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
};

export default AnalyticsPanel;
