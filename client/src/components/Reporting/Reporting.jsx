import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Typography, Grid, Box, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, IconButton, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, Chip
} from '@mui/material';
import {
    FilterAlt as FilterIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// Sub-components
import SalesHistory from './SalesHistory';
import AnalyticsPanel from './AnalyticsPanel';

const Reporting = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [selectedSale, setSelectedSale] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const timeframes = [
        { label: 'Today', getValue: () => getRange('day') },
        { label: 'Yesterday', getValue: () => getRange('yesterday') },
        { label: 'This Week', getValue: () => getRange('week') },
        { label: 'This Month', getValue: () => getRange('month') },
        { label: 'This Year', getValue: () => getRange('year') },
        { label: 'Custom', getValue: () => null }
    ];

    const getRange = (type) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (type) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(now.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                break;
        }
        return { start: start.toISOString(), end: end.toISOString() };
    };

    const fetchReports = async (start, end) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/reports', {
                params: { startDate: start, endDate: end }
            });
            setReportData(res.data);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        const range = getRange('day');
        fetchReports(range.start, range.end);
    }, []);

    const handleApplyTimeframe = () => {
        const selected = timeframes[tabValue];
        if (selected.label === 'Custom') {
            if (dateRange.startDate && dateRange.endDate) {
                fetchReports(dateRange.startDate, dateRange.endDate);
            }
        } else {
            const range = selected.getValue();
            fetchReports(range.start, range.end);
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 4, py: 3, bgcolor: 'background.paper', borderBottom: '1px solid rgba(16, 24, 40, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                    Reports & Analytics
                </Typography>
                <Button variant="outlined" startIcon={<FilterIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Advanced Filters</Button>
            </Box>

            <Container disableGutters maxWidth={false} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {loading && !reportData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress size={60} thickness={4} />
                    </Box>
                ) : (
                    <Grid container sx={{ flex: 1 }}>
                        {/* Left Half: Detailed Sales History */}
                        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column',maxWidth:"50%" }}>
                            <SalesHistory
                                sales={reportData?.sales}
                                timeframeLabel={timeframes[tabValue].label}
                                onSelectSale={setSelectedSale}
                            />
                        </Grid>

                        {/* Right Half: Analytics & Controls */}
                        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column',maxWidth:"50%" }}>
                            <AnalyticsPanel
                                reportData={reportData}
                                loading={loading}
                                tabValue={tabValue}
                                setTabValue={setTabValue}
                                timeframes={timeframes}
                                dateRange={dateRange}
                                setDateRange={setDateRange}
                                onApplyTimeframe={handleApplyTimeframe}
                            />
                        </Grid>
                    </Grid>
                )}

                {/* Sale Detail Dialog */}
                <Dialog
                    open={Boolean(selectedSale)}
                    onClose={() => setSelectedSale(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Sale Details - ORD-{selectedSale?.id}</Typography>
                        <IconButton onClick={() => setSelectedSale(null)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 4 }}>
                        {selectedSale && (
                            <>
                                <Box sx={{ mb: 4, p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #edf2f7' }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={3}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, display: 'block', mb: 0.5 }}>DATE</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(selectedSale.createdAt).toLocaleString()}</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, display: 'block', mb: 0.5 }}>SUBTOTAL</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(selectedSale.totalAmount + selectedSale.discount).toFixed(2)}</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, display: 'block', mb: 0.5 }}>DISCOUNT</Typography>
                                            <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 700 }}>-₹{selectedSale.discount.toFixed(2)}</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, display: 'block', mb: 0.5 }}>NET PROFIT</Typography>
                                            <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 700 }}>₹{selectedSale.profit.toFixed(2)}</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>

                                <TableContainer sx={{ border: '1px solid #edf2f7', borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PRODUCT</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b' }}>QTY</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>UNIT PRICE</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>PROFIT</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>MARGIN</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedSale.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell sx={{ fontWeight: 600 }}>{item.productName}</TableCell>
                                                    <TableCell align="center">{item.quantity}</TableCell>
                                                    <TableCell align="right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                                                    <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>₹{item.profit.toFixed(2)}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={`${item.margin}%`}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                bgcolor: parseFloat(item.margin) > 20 ? '#dcfce7' : '#f0f9ff',
                                                                color: parseFloat(item.margin) > 20 ? '#15803d' : '#0369a1'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setSelectedSale(null)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Close Details</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default Reporting;
