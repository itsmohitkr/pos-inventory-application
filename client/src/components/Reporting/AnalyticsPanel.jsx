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
    loading,
    tabValue,
    setTabValue,
    timeframes,
    dateRange,
    setDateRange,
    onApplyTimeframe
}) => {
    return (
        <Box sx={{ bgcolor: '#fcfcfc', p: 4, display: 'flex', flexDirection: 'column', gap: 4, height: '100%', overflowY: 'auto' }}>
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

            {/* Timeframe Selection Control */}
            <Paper elevation={0} sx={{
                overflow: 'hidden',
                borderRadius: 5,
                border: '1px solid #eef2f6',
                bgcolor: '#ffffff',
                boxShadow: '0 10px 40px rgba(0,0,0,0.04)'
            }}>
                <Box sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                p: 1,
                                borderRadius: '10px',
                                bgcolor: '#e3f2fd',
                                color: '#1a73e8',
                                display: 'flex'
                            }}>
                                <DateIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
                                    Filter Timeframe
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    Select range for analytics
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={onApplyTimeframe}
                            size="large"
                            sx={{
                                borderRadius: 3,
                                px: 4,
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: '#1a73e8',
                                boxShadow: '0 8px 16px rgba(26, 115, 232, 0.24)',
                                '&:hover': {
                                    bgcolor: '#1557b0',
                                    boxShadow: '0 10px 20px rgba(26, 115, 232, 0.3)'
                                }
                            }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Dashboard'}
                        </Button>
                    </Box>

                    <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: 1.2, mb: 1.5, display: 'block' }}>
                        PRESET RANGES
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        mb: tabValue === 5 ? 3 : 0,
                        p: 1,
                        bgcolor: '#f8fafc',
                        borderRadius: 4,
                        border: '1px solid #f1f5f9'
                    }}>
                        {timeframes.map((tf, i) => (
                            <Button
                                key={i}
                                variant="text"
                                onClick={() => setTabValue(i)}
                                sx={{
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1,
                                    fontWeight: 700,
                                    color: tabValue === i ? '#1a73e8' : '#64748b',
                                    bgcolor: tabValue === i ? '#ffffff' : 'transparent',
                                    boxShadow: tabValue === i ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                    '&:hover': {
                                        bgcolor: tabValue === i ? '#ffffff' : '#f1f5f9',
                                        color: tabValue === i ? '#1a73e8' : '#1e293b'
                                    },
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {tf.label}
                            </Button>
                        ))}
                    </Box>

                    {tabValue === 5 && (
                        <Box sx={{
                            p: 3,
                            bgcolor: '#ffffff',
                            borderRadius: 4,
                            border: '2px solid #e2e8f0',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 4, height: 16, bgcolor: '#1a73e8', borderRadius: 1 }} />
                                Custom Date Range
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Start Date & Time"
                                        type="datetime-local"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                bgcolor: '#f8fafc'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="End Date & Time"
                                        type="datetime-local"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                bgcolor: '#f8fafc'
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default AnalyticsPanel;
