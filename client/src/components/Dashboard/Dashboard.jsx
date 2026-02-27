import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import {
    Box,
    Paper,
    TextField,
    Typography,
    Divider,
    FormControl,
    Select,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer
} from '@mui/material';
import { CalendarToday as CalendarIcon, Sync as SyncIcon } from '@mui/icons-material';

const CATEGORY_COLORS = ['#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#059669'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const Dashboard = () => {
    const [report, setReport] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
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

    const fetchPeriodicData = async (start, end) => {
        setLoading(true);
        try {
            const reportRes = await api.get('/api/reports', {
                params: { startDate: start, endDate: end }
            });
            setReport(reportRes.data);
        } catch (error) {
            console.error('Failed to load periodic report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyData = async () => {
        try {
            const currentYear = new Date().getFullYear();
            const res = await api.get('/api/reports/monthly', { params: { year: currentYear } });
            setMonthlyData(res.data || []);
        } catch (error) {
            console.error('Failed to load monthly sales data:', error);
        }
    };

    useEffect(() => {
        const range = getRange("day");
        fetchPeriodicData(range.start, range.end);
        fetchMonthlyData();
    }, []);

    const handleTabChange = (event) => {
        const newValue = event.target.value;
        setTabValue(newValue);
        if (newValue < 4) {
            const range = timeframes[newValue].getValue();
            setDateRange({
                startDate: range.start.split('T')[0],
                endDate: range.end.split('T')[0]
            })
            fetchPeriodicData(range.start, range.end);
        }
    };

    const handleApplyCustomRange = () => {
        if (dateRange.startDate && dateRange.endDate) {
            const start = new Date(dateRange.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
            fetchPeriodicData(start.toISOString(), end.toISOString());
        }
    };

    // Calculate metrics for Periodic Reports section
    const periodicMetrics = useMemo(() => {
        const sales = report?.sales || [];
        const totalSalesAmount = report?.totalSales || 0;

        const productTotals = new Map();
        const categoryTotals = new Map();
        let totalCustomers = sales.length; // Approximate distinct walk-ins

        const hourlySalesAmt = Array.from({ length: 24 }, () => 0);

        sales.forEach((sale) => {
            const saleHour = new Date(sale.createdAt).getHours();
            hourlySalesAmt[saleHour] += sale.netTotalAmount || 0;

            sale.items.forEach((item) => {
                const qty = item.netQuantity ?? (item.quantity - item.returnedQuantity);
                const name = item.productName || item.batch?.product?.name || 'Unknown';
                const category = item.batch?.product?.category || 'Uncategorized';

                const currentProduct = productTotals.get(name) || { amount: 0, qty: 0 };
                productTotals.set(name, {
                    amount: currentProduct.amount + (item.sellingPrice * qty),
                    qty: currentProduct.qty + qty
                });

                categoryTotals.set(category, (categoryTotals.get(category) || 0) + (item.sellingPrice * qty));
            });
        });

        const topProducts = [...productTotals.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);
        const topCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
        const maxHourlySalesAmt = Math.max(...hourlySalesAmt, 0);

        return {
            totalSalesAmount,
            topProducts,
            topCategories,
            hourlySalesAmt,
            maxHourlySalesAmt,
            totalCustomers
        };
    }, [report]);

    // Calculate metrics for Top Monthly row
    const yearMetrics = useMemo(() => {
        if (!monthlyData || monthlyData.length === 0) return { totalYearlySales: 0, topMonthName: 'N/A', topMonthVal: 0, maxMonthVal: 0 };

        let total = 0;
        let highest = { month: 0, val: 0 };
        let maxMonthVal = 0;

        monthlyData.forEach(m => {
            total += m.totalSales;
            if (m.totalSales > highest.val) {
                highest = { month: m.month, val: m.totalSales };
            }
            if (m.totalSales > maxMonthVal) {
                maxMonthVal = m.totalSales;
            }
        });

        return {
            totalYearlySales: total,
            topMonthName: FULL_MONTHS[highest.month] || 'N/A',
            topMonthVal: highest.val,
            maxMonthVal
        };
    }, [monthlyData]);

    const categoryMix = useMemo(() => {
        const entries = periodicMetrics.topCategories || [];
        const total = entries.reduce((sum, [, val]) => sum + val, 0) || 1;

        const segments = entries.map((entry, index) => {
            return {
                name: entry[0],
                value: entry[1],
                percent: (entry[1] / total) * 100,
                color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            }
        });

        let cumulative = 0;
        const gradient = segments.map((stop) => {
            const start = cumulative;
            cumulative += stop.percent;
            return `${stop.color} ${start}% ${cumulative}%`;
        }).join(', ');

        return {
            total,
            segments,
            gradient: gradient ? `conic-gradient(${gradient})` : 'none'
        };
    }, [periodicMetrics.topCategories]);

    const formatShortNum = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    return (
        <Box sx={{ bgcolor: "#f3f4f6", height: "100%", overflowY: "auto", p: 2 }}>
            <Box sx={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* TOP ROW: Monthly Sales & Total Year Sales */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>

                    {/* Monthly Sales Graph */}
                    <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: 0, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box>
                                <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 300, letterSpacing: '-0.5px' }}>
                                    Monthly Sales - {new Date().getFullYear()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9ca3af' }}>Sales data grouped by month</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, color: '#6b7280' }}>
                                <SyncIcon fontSize="small" sx={{ cursor: 'pointer' }} onClick={fetchMonthlyData} />
                            </Box>
                        </Box>

                        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'flex-end', height: 140, position: 'relative' }}>
                            {/* Y-Axis scale lines */}
                            <Box sx={{ position: 'absolute', top: 0, bottom: 20, left: 0, right: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
                                {[1, 0.8, 0.6, 0.4, 0.2, 0].map(tier => (
                                    <Box key={tier} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#9ca3af', width: 30 }}>
                                            {Math.round(yearMetrics.maxMonthVal * tier)}
                                        </Typography>
                                        <Box sx={{ flex: 1, height: '1px', bgcolor: tier === 0 ? '#d1d5db' : '#f3f4f6' }} />
                                    </Box>
                                ))}
                            </Box>

                            {/* Bars */}
                            <Box sx={{ display: 'flex', ml: '30px', flex: 1, zIndex: 1, height: '100%', alignItems: 'flex-end' }}>
                                {monthlyData.map((data, idx) => {
                                    const hPct = yearMetrics.maxMonthVal > 0 ? (data.totalSales / yearMetrics.maxMonthVal) * 100 : 0;
                                    return (
                                        <Box key={idx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                            {data.totalSales > 0 && (
                                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#fff', mb: 0.5, zIndex: 2, mt: '-15px' }}>
                                                    {data.totalSales.toFixed(2)}
                                                </Typography>
                                            )}
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: `${hPct}%`,
                                                    bgcolor: '#06b6d4',
                                                    borderRight: '1px solid #fff'
                                                }}
                                            />
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', ml: '30px', borderTop: '1px solid #d1d5db' }}>
                            {MONTHS.map(m => (
                                <Typography key={m} variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: '#4b5563', mt: 0.5 }}>
                                    {m.charAt(0)}
                                </Typography>
                            ))}
                        </Box>
                        <Typography variant="caption" sx={{ textAlign: 'center', color: '#6b7280', fontSize: '0.6rem', mt: 1 }}>Month</Typography>
                    </Paper>

                    {/* Total Sales (Year) */}
                    <Paper elevation={0} sx={{ width: '300px', p: 2, borderRadius: 0, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 400 }}>Total Sales</Typography>
                        <Typography variant="h2" sx={{ fontWeight: 800, color: '#374151', mt: 0, letterSpacing: '-1px' }}>
                            {formatShortNum(yearMetrics.totalYearlySales)}
                        </Typography>

                        <Box sx={{ mt: 'auto', pt: 2 }}>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>Top performing month:</Typography>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600 }}>{yearMetrics.topMonthName}</Typography>
                            <Typography variant="h6" sx={{ color: '#4b5563', fontWeight: 600 }}>{yearMetrics.topMonthVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                        </Box>
                    </Paper>

                </Box>

                {/* PERIODIC REPORTS HEADER */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 400 }}>
                        Periodic Reports ( {formatDateDisplay(dateRange.startDate)} - {formatDateDisplay(dateRange.endDate)} )
                    </Typography>
                    <CalendarIcon sx={{ color: '#374151', fontSize: '1.2rem' }} />
                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#d1d5db', ml: 2 }} />

                    <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                                value={tabValue}
                                onChange={handleTabChange}
                                sx={{ bgcolor: '#fff', borderRadius: 0, height: 32, fontSize: '0.85rem' }}
                            >
                                {timeframes.map((tf, idx) => (
                                    <MenuItem key={idx} value={idx}>{tf.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {tabValue === 4 && (
                            <>
                                <TextField
                                    type="date"
                                    size="small"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    sx={{ bgcolor: '#fff', '& .MuiInputBase-root': { height: 32, fontSize: '0.85rem', borderRadius: 0 } }}
                                />
                                <TextField
                                    type="date"
                                    size="small"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    sx={{ bgcolor: '#fff', '& .MuiInputBase-root': { height: 32, fontSize: '0.85rem', borderRadius: 0 } }}
                                />
                                <Button variant="contained" onClick={handleApplyCustomRange} sx={{ height: 32, borderRadius: 0, bgcolor: '#374151', '&:hover': { bgcolor: '#1f2937' }, boxShadow: 'none' }}>
                                    GO
                                </Button>
                            </>
                        )}
                    </Stack>
                </Box>

                {/* MIDDLE ROW */}
                <Box sx={{ display: 'flex', gap: 2, height: '300px' }}>

                    {/* Top Products */}
                    <Paper elevation={0} sx={{ flex: '1 1 30%', p: 2, borderRadius: 0, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 300 }}>Top Products</Typography>
                        </Box>

                        <TableContainer sx={{ flex: 1 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#0ea5e9', borderBottom: '2px solid #0ea5e9', py: 0.5, px: 0 }}>Product</TableCell>
                                        <TableCell align="right" sx={{ color: '#6b7280', borderBottom: '1px solid #d1d5db', py: 0.5, px: 0 }}>Qty</TableCell>
                                        <TableCell align="right" sx={{ color: '#6b7280', borderBottom: '1px solid #d1d5db', py: 0.5, px: 0 }}>Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {periodicMetrics.topProducts.map(([name, data]) => (
                                        <TableRow key={name}>
                                            <TableCell sx={{ py: 1, px: 0, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}>{name}</TableCell>
                                            <TableCell align="right" sx={{ py: 1, px: 0, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}>{data.qty}</TableCell>
                                            <TableCell align="right" sx={{ py: 1, px: 0, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}>
                                                {data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Hourly Sales */}
                    <Paper elevation={0} sx={{ flex: '1 1 40%', p: 2, borderRadius: 0, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 300 }}>Hourly Sales</Typography>
                            <Typography variant="caption" sx={{ color: '#4b5563' }}>Amount ▼</Typography>
                        </Box>

                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                            {/* Y-Axis lines */}
                            <Box sx={{ position: 'absolute', top: 0, bottom: 20, left: 0, right: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
                                {[1, 0.8, 0.6, 0.4, 0.2, 0].map(tier => (
                                    <Box key={tier} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#d1d5db', width: 30 }}>
                                            {Math.round(periodicMetrics.maxHourlySalesAmt * tier)}
                                        </Typography>
                                        <Box sx={{ flex: 1, height: '1px', bgcolor: tier === 0 ? '#d1d5db' : '#f3f4f6' }} />
                                    </Box>
                                ))}
                            </Box>

                            {/* Bars */}
                            <Box sx={{ display: 'flex', ml: '30px', flex: 1, zIndex: 1, height: '100%', alignItems: 'flex-end' }}>
                                {periodicMetrics.hourlySalesAmt.map((amt, idx) => {
                                    // Extract visible trading hours (e.g., 9am to 9pm) or dynamic window
                                    // For simplicity matching the graphic, we'll plot every hour but only values > 0 are visible
                                    const hPct = periodicMetrics.maxHourlySalesAmt > 0 ? (amt / periodicMetrics.maxHourlySalesAmt) * 100 : 0;
                                    const barColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                                    return (
                                        <Box key={idx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', px: '1px' }}>
                                            {amt > 0 && (
                                                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#fff', mb: 0.5, zIndex: 2, mt: '-12px' }}>
                                                    {Math.round(amt)}
                                                </Typography>
                                            )}
                                            {amt > 0 && <Box sx={{ width: '100%', height: `${hPct}%`, bgcolor: barColor }} />}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                        <Typography variant="caption" sx={{ textAlign: 'center', color: '#6b7280', fontSize: '0.6rem', mt: 1 }}>Hour</Typography>
                    </Paper>

                    {/* Total Sales (Period) */}
                    <Paper elevation={0} sx={{ flex: '1 1 30%', p: 2, borderRadius: 0, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 300, mb: 1 }}>Total Sales (Amount)</Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h1" sx={{ fontWeight: 800, color: '#374151', letterSpacing: '-2px', textShadow: '2px 2px 0px #fff' }}>
                                {formatShortNum(periodicMetrics.totalSalesAmount)}
                            </Typography>
                        </Box>
                    </Paper>

                </Box>

                {/* BOTTOM ROW */}
                <Box sx={{ display: 'flex', gap: 2, height: '220px' }}>

                    {/* Top Product Groups */}
                    <Paper elevation={0} sx={{ flex: '1 1 30%', p: 2, borderRadius: 0, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 300, mb: 0 }}>Top Product Groups</Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', mb: 2 }}>Top selling product groups in selected period</Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
                                <Box sx={{ width: 100, height: 100, borderRadius: '50%', background: categoryMix.gradient, position: 'relative' }}>
                                    {/* Donut hole */}
                                    <Box sx={{ position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', bgcolor: '#fff', borderRadius: '50%' }} />
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, overflowY: 'auto', maxHeight: '120px' }}>
                                {categoryMix.segments.map(seg => (
                                    <Box key={seg.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 16, bgcolor: seg.color }} />
                                        <Typography variant="caption" sx={{ color: '#4b5563', fontSize: '0.65rem' }}>{seg.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Paper>

                    {/* Top Customers (Replaced with Walk-In fill) */}
                    <Paper elevation={0} sx={{ flex: '1 1 70%', p: 2, borderRadius: 0, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 300, mb: 0 }}>Top Customers</Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', mb: 2 }}>Lead customers in selected period (top 5)</Typography>

                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '40px' }}>
                                <Typography variant="caption" sx={{ color: '#4b5563', lineHeight: 1 }}>walk-in<br />customers</Typography>
                            </Box>
                            <Box sx={{ flex: 1, height: '100px', bgcolor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 2 }}>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>{periodicMetrics.totalCustomers}</Typography>
                            </Box>
                        </Box>
                    </Paper>

                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard;
