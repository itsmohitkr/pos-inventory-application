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
        </Box>
    );
};

export default AnalyticsPanel;
