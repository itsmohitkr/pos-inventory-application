import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    TextField,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Receipt as ReceiptIcon,
    LocalShipping as ShippingIcon
} from '@mui/icons-material';
import api from '../../api';

// Helper to get local date string YYYY-MM-DD
const getLocalTodayString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1).split('T')[0];
};

const ExpenseManagement = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtering states
    const [dateFilter, setDateFilter] = useState('thisMonth');
    const [customDates, setCustomDates] = useState({ start: getLocalTodayString(), end: getLocalTodayString() });

    // Dialog states
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    // Form states
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        category: 'Misc',
        description: '',
        date: getLocalTodayString()
    });

    const [purchaseForm, setPurchaseForm] = useState({
        vendor: '',
        totalAmount: '',
        date: getLocalTodayString(),
        note: '',
        items: []
    });

    const categories = ['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc'];

    useEffect(() => {
        if (dateFilter !== 'custom') {
            fetchData();
        }
    }, [dateFilter]);

    const getDateRange = () => {
        if (dateFilter === 'custom') {
            return {
                startDate: customDates.start ? new Date(`${customDates.start}T00:00:00`).toISOString() : undefined,
                endDate: customDates.end ? new Date(`${customDates.end}T23:59:59.999`).toISOString() : undefined
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(today);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        switch (dateFilter) {
            case 'today':
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                end.setDate(end.getDate() - 1);
                break;
            case 'thisWeek':
                const day = start.getDay();
                // Monday as start of week
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                break;
            case 'thisMonth':
                start.setDate(1);
                break;
            case 'thisYear':
                start.setMonth(0, 1);
                break;
            default:
                return {};
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { startDate, endDate } = getDateRange();

            let queryParams = '?';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            queryParams += params.toString();

            const [expRes, purRes] = await Promise.all([
                api.get(`/api/expenses${queryParams}`),
                api.get(`/api/purchases${queryParams}`)
            ]);
            setExpenses(expRes.data);
            setPurchases(purRes.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenExpenseDialog = () => {
        setExpenseForm({ amount: '', category: 'Misc', description: '', date: getLocalTodayString() });
        setExpenseDialogOpen(true);
    };

    const handleOpenPurchaseDialog = () => {
        setPurchaseForm({ vendor: '', totalAmount: '', date: getLocalTodayString(), note: '', items: [] });
        setPurchaseDialogOpen(true);
    };

    const handleCreateExpense = async () => {
        try {
            await api.post('/api/expenses', expenseForm);
            setExpenseDialogOpen(false);
            fetchData();
        } catch (err) {
            setError('Failed to create expense');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await api.delete(`/api/expenses/${id}`);
                fetchData();
            } catch (err) {
                setError('Failed to delete expense');
            }
        }
    };

    const handleCreatePurchase = async () => {
        try {
            const submissionData = {
                ...purchaseForm,
                totalAmount: parseFloat(purchaseForm.totalAmount) || 0,
                items: (purchaseForm.items || []).filter(item => item.productId && item.quantity)
            };

            await api.post('/api/purchases', submissionData);
            setPurchaseDialogOpen(false);
            fetchData();
        } catch (err) {
            console.error('Purchase creation error:', err);
            setError('Failed to create purchase. Please check your inputs.');
        }
    };

    // Derived totals
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Financial Tracking
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Time Frame</InputLabel>
                        <Select
                            value={dateFilter}
                            label="Time Frame"
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <MenuItem value="today">Today</MenuItem>
                            <MenuItem value="yesterday">Yesterday</MenuItem>
                            <MenuItem value="thisWeek">This Week</MenuItem>
                            <MenuItem value="thisMonth">This Month</MenuItem>
                            <MenuItem value="thisYear">This Year</MenuItem>
                            <MenuItem value="custom">Custom Date</MenuItem>
                        </Select>
                    </FormControl>

                    {dateFilter === 'custom' && (
                        <>
                            <TextField
                                size="small"
                                type="date"
                                label="Start"
                                value={customDates.start}
                                onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="End"
                                value={customDates.end}
                                onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                            <Button variant="outlined" onClick={fetchData} sx={{ height: 40 }}>
                                Apply
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab icon={<ReceiptIcon />} iconPosition="start" label="Expenses" />
                    <Tab icon={<ShippingIcon />} iconPosition="start" label="Inventory Purchases" />
                </Tabs>

                <Box sx={{ p: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                    {activeTab === 0 && (
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6">Operating Expenses</Typography>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenExpenseDialog}>
                                    Add Expense
                                </Button>
                            </Stack>

                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Category</TableCell>
                                            <TableCell>Description</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {expenses.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{row.category}</TableCell>
                                                <TableCell>{row.description}</TableCell>
                                                <TableCell align="right">₹{row.amount.toLocaleString()}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteExpense(row.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {expenses.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">No expenses found for this period</TableCell>
                                            </TableRow>
                                        )}
                                        {/* Highlighted Total Row */}
                                        {expenses.length > 0 && (
                                            <TableRow sx={{ bgcolor: 'rgba(242, 181, 68, 0.1)' }}>
                                                <TableCell colSpan={3} sx={{ py: 1.5 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" textAlign="right" color="primary.dark">
                                                        Total Current Period
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" colSpan={2} sx={{ py: 1.5 }}>
                                                    <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                                        ₹{totalExpensesAmount.toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6">Inventory Purchases</Typography>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenPurchaseDialog}>
                                    Log Purchase
                                </Button>
                            </Stack>

                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Vendor</TableCell>
                                            <TableCell>Note</TableCell>
                                            <TableCell align="right">Total Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {purchases.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{row.vendor || 'N/A'}</TableCell>
                                                <TableCell>{row.note}</TableCell>
                                                <TableCell align="right">₹{row.totalAmount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {purchases.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">No purchases recorded for this period</TableCell>
                                            </TableRow>
                                        )}
                                        {/* Highlighted Total Row */}
                                        {purchases.length > 0 && (
                                            <TableRow sx={{ bgcolor: 'rgba(242, 181, 68, 0.1)' }}>
                                                <TableCell colSpan={3} sx={{ py: 1.5 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" textAlign="right" color="primary.dark">
                                                        Total Current Period
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.5 }}>
                                                    <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                                        ₹{totalPurchasesAmount.toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Expense Form Dialog */}
            <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Amount"
                                    type="number"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={expenseForm.category}
                                        label="Category"
                                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    >
                                        {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateExpense} disabled={!expenseForm.amount}>Save Expense</Button>
                </DialogActions>
            </Dialog>

            {/* Purchase Form Dialog */}
            <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Log Inventory Purchase</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Vendor Name"
                                    value={purchaseForm.vendor}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Total Amount"
                                    type="number"
                                    value={purchaseForm.totalAmount}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    value={purchaseForm.date}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Note"
                                    multiline
                                    rows={2}
                                    value={purchaseForm.note}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreatePurchase} disabled={!purchaseForm.totalAmount}>Log Purchase</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExpenseManagement;
