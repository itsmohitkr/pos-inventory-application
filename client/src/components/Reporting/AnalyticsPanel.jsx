import React from 'react';
import {
    Box, Typography, Grid, Paper, Button, CircularProgress, TextField
} from '@mui/material';
import {
    TrendingUp as SalesIcon,
    Savings as ProfitIcon,
    ListAlt as OrdersIcon,
    DateRange as DateIcon,
    BarChart as MarginIcon
} from '@mui/icons-material';
import StatCard from './StatCard';

const AnalyticsPanel = ({
    reportData,
    loading
}) => {
    return (
        <Box sx={{ bgcolor: '#fcfcfc', p: 4, display: 'flex', flexDirection: 'column', gap: 4, height: '100%', overflowY: 'auto', borderRadius: 1 }}>
            {/* Performance Grid */}
            <Box>
                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}>
                    PERFORMANCE SUMMARY
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <StatCard
                            title="Total Sales"
                            value={reportData?.totalSales || 0}
                            icon={<SalesIcon />}
                            color="#2e7d32"
                            isCurrency={true}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <StatCard
                            title="Total Profit"
                            value={reportData?.totalProfit || 0}
                            icon={<ProfitIcon />}
                            color="#1976d2"
                            isCurrency={true}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <StatCard
                            title="Avg Margin"
                            value={reportData?.totalSales > 0 ? ((reportData.totalProfit / reportData.totalSales) * 100).toFixed(1) + '%' : '0%'}
                            icon={<MarginIcon />}
                            color="#9c27b0"
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <StatCard
                            title="Orders"
                            value={reportData?.totalOrders || 0}
                            icon={<OrdersIcon />}
                            color="#ed6c02"
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Payment Method Breakdown */}
            <Box>
                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}>
                    PAYMENT METHOD BREAKDOWN
                </Typography>
                <Grid container spacing={3}>
                    {(() => {
                        const sales = reportData?.sales || [];
                        const methods = sales.reduce((acc, sale) => {
                            const method = sale.paymentMethod || 'Cash';
                            acc[method] = (acc[method] || 0) + (sale.netTotalAmount || 0);
                            return acc;
                        }, {});

                        if (Object.keys(methods).length === 0) {
                            return (
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No payment data available for this period.
                                    </Typography>
                                </Grid>
                            );
                        }

                        return Object.entries(methods).map(([method, total]) => (
                            <Grid item xs={6} key={method}>
                                <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                                        {method.toUpperCase()}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        ₹{total.toFixed(2)}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ));
                    })()}
                </Grid>
            </Box>
        </Box>
    );
};

export default AnalyticsPanel;
