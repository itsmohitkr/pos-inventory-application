import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    TextField,
    Typography,
    Divider,
    Tabs,
    Tab
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';

const LOW_STOCK_THRESHOLD = 10;
const CATEGORY_COLORS = ['#0b1d39', '#f2b544', '#1f8a5b', '#d97706', '#2563eb', '#7c3aed'];

const Dashboard = () => {
    const [report, setReport] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
    });

    const timeframes = [
        { label: "Today", getValue: () => getRange("day") },
        { label: "Yesterday", getValue: () => getRange("yesterday") },
        { label: "This Week", getValue: () => getRange("week") },
        { label: "This Month", getValue: () => getRange("month") },
        { label: "Custom", getValue: () => null },
    ];

    const getRange = (type) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (type) {
            case "day":
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case "yesterday":
                start.setDate(now.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(now.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case "week": {
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                start.setDate(now.getDate() - diffToMonday);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            }
            case "month":
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                break;
        }
        return { start: start.toISOString(), end: end.toISOString() };
    };

    const fetchData = async (start, end) => {
        setLoading(true);
        try {
            const [reportRes, productRes] = await Promise.all([
                axios.get('/api/reports', {
                    params: {
                        startDate: start,
                        endDate: end
                    }
                }),
                axios.get('/api/products', {
                    params: { page: 1, pageSize: 1000 }
                })
            ]);

            setReport(reportRes.data);
            setProducts(productRes.data.data || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const range = getRange("day");
        fetchData(range.start, range.end);
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        if (newValue < 4) {
            const range = timeframes[newValue].getValue();
            fetchData(range.start, range.end);
        }
    };

    const handleApplyCustomRange = () => {
        if (dateRange.startDate && dateRange.endDate) {
            const start = new Date(dateRange.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
            fetchData(start.toISOString(), end.toISOString());
        }
    };

    const metrics = useMemo(() => {
        const sales = report?.sales || [];
        const totalSales = report?.totalSales || 0;
        const totalProfit = report?.totalProfit || 0;
        const totalOrders = report?.totalOrders || 0;

        const productTotals = new Map();
        const productMargins = new Map();
        const categoryTotals = new Map();
        let totalItemsSold = 0;
        const hourlyQty = Array.from({ length: 24 }, () => 0);

        sales.forEach((sale) => {
            const saleHour = new Date(sale.createdAt).getHours();
            sale.items.forEach((item) => {
                const qty = item.netQuantity ?? (item.quantity - item.returnedQuantity);
                const name = item.productName || item.batch?.product?.name || 'Unknown';
                const category = item.batch?.product?.category || 'Uncategorized';
                totalItemsSold += qty;
                hourlyQty[saleHour] += qty;

                productTotals.set(name, (productTotals.get(name) || 0) + qty);
                categoryTotals.set(category, (categoryTotals.get(category) || 0) + qty);

                const margin = item.sellingPrice > 0
                    ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100
                    : 0;
                const existingMargin = productMargins.get(name);
                if (existingMargin === undefined || margin > existingMargin) {
                    productMargins.set(name, margin);
                }
            });
        });

        const topSelling = [...productTotals.entries()].sort((a, b) => b[1] - a[1]);
        const topSellingProduct = topSelling[0] || ['N/A', 0];
        const highestMargin = [...productMargins.entries()].sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

        const hourlySales = sales.reduce((acc, sale) => {
            const hour = new Date(sale.createdAt).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        const peakHourEntry = Object.entries(hourlySales).sort((a, b) => b[1] - a[1])[0];
        const peakHour = peakHourEntry ? Number(peakHourEntry[0]) : null;
        const peakHourLabel = peakHour === null
            ? 'No data'
            : `${((peakHour + 11) % 12) + 1}:00 ${peakHour < 12 ? 'AM' : 'PM'} - ${((peakHour + 12) % 12) + 1}:00 ${peakHour < 11 ? 'AM' : 'PM'}`;

        return {
            totalSales,
            totalProfit,
            totalOrders,
            totalItemsSold,
            profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
            avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
            topSelling,
            topSellingProduct,
            highestMargin,
            peakHourLabel,
            hourlyQty,
            maxHourlyQty: Math.max(...hourlyQty, 0),
            categoryMix: [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])
        };
    }, [report]);

    const stockWarnings = useMemo(() => ({
        lowStock: products.filter(p => p.total_stock > 0 && p.total_stock <= LOW_STOCK_THRESHOLD),
        zeroStock: products.filter(p => p.total_stock === 0)
    }), [products]);

    const topSellingGraph = metrics.topSelling.slice(0, 5);
    const maxTopQty = topSellingGraph[0]?.[1] || 1;

    const categoryMix = useMemo(() => {
        const entries = metrics.categoryMix || [];
        const total = entries.reduce((sum, [, qty]) => sum + qty, 0) || 1;
        const top = entries.slice(0, 5);
        const otherQty = entries.slice(5).reduce((sum, [, qty]) => sum + qty, 0);
        const segments = [...top];
        if (otherQty > 0) segments.push(['Other', otherQty]);

        const gradientStops = segments.map(([, qty], index) => {
            const percent = (qty / total) * 100;
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            return { color, percent };
        });

        let cumulative = 0;
        const gradient = gradientStops.map((stop) => {
            const start = cumulative;
            cumulative += stop.percent;
            return `${stop.color} ${start}% ${cumulative}%`;
        }).join(', ');

        return {
            total,
            segments,
            gradient: gradient ? `conic-gradient(${gradient})` : 'none'
        };
    }, [metrics.categoryMix]);

    return (
        <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 5 }, mb: 6 }}>
            <Paper
                elevation={0}
                sx={{
                    m: -3,
                    mb: 4,
                    px: 4,
                    py: 2.5,
                    background: "linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)",
                    borderBottom: "1px solid rgba(16, 24, 40, 0.08)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                        Dashboard
                    </Typography>
                    <Box sx={{ minWidth: 280, display: "flex", justifyContent: "flex-end" }}>
                        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtonsDisplay="auto">
                            {timeframes.map((tf, idx) => (
                                <Tab key={idx} label={tf.label} />
                            ))}
                        </Tabs>
                    </Box>
                </Box>

                {tabValue === 4 && (
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "flex-end", mt: 2, pt: 2, borderTop: "1px solid #eee", flexWrap: "wrap" }}>
                        <TextField
                            type="date"
                            label="From"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                        <TextField
                            type="date"
                            label="To"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                        <Button variant="contained" onClick={handleApplyCustomRange} startIcon={<CalendarIcon />} sx={{ bgcolor: "#0b1d39", "&:hover": { bgcolor: "#1b3e6f" } }}>
                            Apply
                        </Button>
                    </Box>
                )}
            </Paper>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, color: '#fff', background: 'linear-gradient(135deg, #1f8a5b 0%, #3ccf9a 100%)' }}>
                        <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Daily report</Typography>
                        <Typography variant="h5" fontWeight="bold">₹{metrics.totalSales.toFixed(2)}</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Total sales</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, color: '#fff', background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)' }}>
                        <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Daily status</Typography>
                        <Typography variant="h5" fontWeight="bold">{metrics.totalOrders}</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Orders in range</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, color: '#fff', background: 'linear-gradient(135deg, #f2b544 0%, #f8d27b 100%)' }}>
                        <Typography variant="overline" sx={{ color: 'rgba(32, 18, 6, 0.75)' }}>Sales</Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#2d1c05' }}>₹{metrics.avgOrderValue.toFixed(2)}</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(32, 18, 6, 0.75)' }}>Average order value</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, color: '#fff', background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}>
                        <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>Profit margin</Typography>
                        <Typography variant="h5" fontWeight="bold">{metrics.profitMargin.toFixed(1)}%</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>Overall</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, height: '100%', background: 'linear-gradient(135deg, rgba(11, 29, 57, 0.06), rgba(27, 62, 111, 0.08))' }}>
                        <Typography variant="subtitle1" fontWeight="bold">Highest profit margin</Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>{metrics.highestMargin[0]}</Typography>
                        <Typography variant="body2" color="text.secondary">Margin: {metrics.highestMargin[1].toFixed(1)}%</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary">Top selling product</Typography>
                        <Typography variant="body1" fontWeight="bold">{metrics.topSellingProduct[0]}</Typography>
                        <Typography variant="caption" color="text.secondary">Qty sold: {metrics.topSellingProduct[1]}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, height: '100%', background: 'linear-gradient(135deg, rgba(242, 181, 68, 0.15), rgba(255, 215, 128, 0.18))' }}>
                        <Typography variant="subtitle1" fontWeight="bold">Peak sales time</Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>{metrics.peakHourLabel}</Typography>
                        <Typography variant="body2" color="text.secondary">Based on order volume</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary">Total items sold</Typography>
                        <Typography variant="body1" fontWeight="bold">{metrics.totalItemsSold}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, height: '100%', background: 'linear-gradient(135deg, rgba(31, 138, 91, 0.12), rgba(60, 207, 154, 0.16))' }}>
                        <Typography variant="subtitle1" fontWeight="bold">Top selling product graph</Typography>
                        <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                            {topSellingGraph.map(([name, qty]) => (
                                <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ width: 120 }} noWrap>{name}</Typography>
                                    <Box sx={{ flex: 1, height: 8, bgcolor: 'rgba(11, 29, 57, 0.1)', borderRadius: 99 }}>
                                        <Box sx={{ width: `${(qty / maxTopQty) * 100}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 99 }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ width: 36, textAlign: 'right' }}>{qty}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={7}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Sales by hour (items sold)</Typography>
                        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gap: 0.5, alignItems: 'end', height: 160 }}>
                            {metrics.hourlyQty.map((qty, hour) => (
                                <Box key={hour} sx={{ textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            height: `${metrics.maxHourlyQty ? (qty / metrics.maxHourlyQty) * 120 : 0}px`,
                                            bgcolor: qty > 0 ? 'primary.main' : 'rgba(11, 29, 57, 0.1)',
                                            borderRadius: 1,
                                            transition: 'height 0.2s ease'
                                        }}
                                    />
                                    {(hour % 6 === 0) && <Typography variant="caption" color="text.secondary">{hour}</Typography>}
                                </Box>
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">Bars show item quantity sold per hour.</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Category mix</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                            <Box sx={{ width: 160, height: 160, borderRadius: '50%', background: categoryMix.gradient, boxShadow: '0 12px 30px rgba(11, 29, 57, 0.15)' }} />
                            <Box sx={{ display: 'grid', gap: 1, flex: 1 }}>
                                {categoryMix.segments.map(([name, qty], index) => (
                                    <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                                        <Typography variant="body2" sx={{ flex: 1 }} noWrap>{name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{Math.round((qty / categoryMix.total) * 100)}%</Typography>
                                    </Box>
                                ))}
                                {!categoryMix.segments.length && <Typography variant="body2" color="text.secondary">No category data.</Typography>}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Lower stock warning</Typography>
                        <Typography variant="body2" color="text.secondary">Below {LOW_STOCK_THRESHOLD} units</Typography>
                        <Divider sx={{ my: 1.5 }} />
                        {stockWarnings.lowStock.slice(0, 6).map(item => (
                            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2">{item.name}</Typography>
                                <Typography variant="body2" fontWeight="bold">{item.total_stock}</Typography>
                            </Box>
                        ))}
                        {!stockWarnings.lowStock.length && <Typography variant="body2" color="text.secondary">No low stock items.</Typography>}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Zero stock warning</Typography>
                        <Typography variant="body2" color="text.secondary">Out of stock items</Typography>
                        <Divider sx={{ my: 1.5 }} />
                        {stockWarnings.zeroStock.slice(0, 6).map(item => (
                            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2">{item.name}</Typography>
                                <Typography variant="body2" fontWeight="bold">0</Typography>
                            </Box>
                        ))}
                        {!stockWarnings.zeroStock.length && <Typography variant="body2" color="text.secondary">No zero stock items.</Typography>}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
