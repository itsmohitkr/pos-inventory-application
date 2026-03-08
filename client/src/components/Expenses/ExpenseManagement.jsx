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
    Divider,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Receipt as ReceiptIcon,
    LocalShipping as ShippingIcon,
    Edit as EditIcon
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
        id: null,
        amount: '',
        category: '',
        description: '',
        date: getLocalTodayString()
    });

    const [purchaseForm, setPurchaseForm] = useState({
        id: null,
        vendor: '',
        totalAmount: '',
        date: getLocalTodayString(),
        note: '',
        paymentStatus: 'Paid',
        items: []
    });

    const categories = ['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc'];

    useEffect(() => {
        if (dateFilter !== 'custom') {
            fetchData();
        }
    }, [dateFilter]);

    const getDateRange = (type) => {
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);

        switch (type) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            case 'yesterday':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
                break;
            case 'thisWeek': {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            }
            case 'lastWeek': {
                const day = now.getDay();
                const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 7, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 1, 23, 59, 59, 999);
                break;
            }
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'thisYear':
                start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            case 'lastYear':
                start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
                end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                break;
            case 'custom': {
                const start = customDates.start ? (() => {
                    const [y, m, d] = customDates.start.split('-').map(Number);
                    return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
                })() : undefined;

                const end = customDates.end ? (() => {
                    const [y, m, d] = customDates.end.split('-').map(Number);
                    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
                })() : undefined;

                return { startDate: start, endDate: end };
            }
            default:
                return {};
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const range = getDateRange(dateFilter);
            const { startDate, endDate } = range;

            let queryParams = '?';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            queryParams += params.toString();

            const [expRes, purRes] = await Promise.all([
                api.get(`/api/expenses${queryParams}`),
                api.get(`/api/purchases${queryParams}`)
            ]);
            const sortedExp = expRes.data.sort((a, b) => {
                if (a.date === b.date) return b.id - a.id;
                return new Date(b.date) - new Date(a.date);
            });
            const sortedPur = purRes.data.sort((a, b) => {
                if (a.date === b.date) return b.id - a.id;
                return new Date(b.date) - new Date(a.date);
            });
            setExpenses(sortedExp);
            setPurchases(sortedPur);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenExpenseDialog = () => {
        setExpenseForm({ id: null, amount: '', category: '', description: '', date: getLocalTodayString() });
        setExpenseDialogOpen(true);
    };

    const handleOpenPurchaseDialog = () => {
        setPurchaseForm({ id: null, vendor: '', totalAmount: '', date: getLocalTodayString(), note: '', paymentStatus: 'Paid', items: [] });
        setPurchaseDialogOpen(true);
    };

    const handleEditExpense = (expense) => {
        setExpenseForm({
            id: expense.id,
            amount: expense.amount,
            category: expense.category,
            description: expense.description || '',
            date: new Date(expense.date).toISOString().split('T')[0]
        });
        setExpenseDialogOpen(true);
    };

    const handleEditPurchase = (purchase) => {
        setPurchaseForm({
            id: purchase.id,
            vendor: purchase.vendor || '',
            totalAmount: purchase.totalAmount,
            note: purchase.note || '',
            date: new Date(purchase.date).toISOString().split('T')[0],
            paymentStatus: purchase.paymentStatus || 'Paid',
            items: purchase.items || []
        });
        setPurchaseDialogOpen(true);
    };

    const handleCreateExpense = async (e) => {
        if (e) e.preventDefault();
        try {
            if (expenseForm.id) {
                await api.put(`/api/expenses/${expenseForm.id}`, expenseForm);
            } else {
                await api.post('/api/expenses', expenseForm);
            }
            setExpenseDialogOpen(false);
            fetchData();
        } catch (err) {
            setError('Failed to save expense');
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

    const handleCreatePurchase = async (e) => {
        if (e) e.preventDefault();
        try {
            const submissionData = {
                ...purchaseForm,
                totalAmount: parseFloat(purchaseForm.totalAmount) || 0,
                items: (purchaseForm.items || []).filter(item => item.productId && item.quantity)
            };

            if (purchaseForm.id) {
                await api.put(`/api/purchases/${purchaseForm.id}`, submissionData);
            } else {
                await api.post('/api/purchases', submissionData);
            }
            setPurchaseDialogOpen(false);
            fetchData();
        } catch (err) {
            console.error('Purchase saving error:', err);
            setError('Failed to save purchase. Please check your inputs.');
        }
    };

    const handleDeletePurchase = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase?')) {
            try {
                await api.delete(`/api/purchases/${id}`);
                fetchData();
            } catch (err) {
                setError('Failed to delete purchase');
            }
        }
    };

    // Derived totals
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    return (
        <Box
            sx={{
                bgcolor: "background.default",
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    m: 3,
                    px: 4,
                    py: 2.5,
                    background: "linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)",
                    borderBottom: "1px solid rgba(16, 24, 40, 0.08)",
                    flexShrink: 0
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>
                            Financial Tracking
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Monitor operating expenses and inventory purchases.
                        </Typography>
                    </Box>

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
                                <MenuItem value="lastWeek">Last Week</MenuItem>
                                <MenuItem value="thisMonth">This Month</MenuItem>
                                <MenuItem value="lastMonth">Last Month</MenuItem>
                                <MenuItem value="thisYear">This Year</MenuItem>
                                <MenuItem value="lastYear">Last Year</MenuItem>
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
            </Paper>

            <Box sx={{ flex: 1, overflow: 'auto', px: 3, pb: 3 }}>
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
                                                    <TableCell>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</TableCell>
                                                    <TableCell>{row.category}</TableCell>
                                                    <TableCell>{row.description}</TableCell>
                                                    <TableCell align="right">₹{row.amount.toLocaleString()}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" color="primary" onClick={() => handleEditExpense(row)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
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
                                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                                        <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                                            ₹{totalExpensesAmount.toLocaleString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.5 }} />
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
                                                <TableCell align="right">Amount</TableCell>
                                                <TableCell align="center">Status</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {purchases.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</TableCell>
                                                    <TableCell>{row.vendor || 'N/A'}</TableCell>
                                                    <TableCell>{row.note}</TableCell>
                                                    <TableCell align="right">₹{row.totalAmount.toLocaleString()}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={row.paymentStatus || 'Paid'}
                                                            size="small"
                                                            color={row.paymentStatus === 'Unpaid' ? 'error' : 'success'}
                                                            sx={{ fontWeight: 'bold', minWidth: 70 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" color="primary" onClick={() => handleEditPurchase(row)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleDeletePurchase(row.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {purchases.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center">No purchases recorded for this period</TableCell>
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
                                                    <TableCell colSpan={2} sx={{ py: 1.5 }} />
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
                    <form onSubmit={handleCreateExpense}>
                        <DialogTitle>{expenseForm.id ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Amount"
                                            type="number"
                                            value={expenseForm.amount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Expenses for?"
                                            value={expenseForm.category}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                            placeholder="Enter category details..."
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            required
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
                            <Button variant="contained" type="submit" disabled={!expenseForm.amount || !expenseForm.category || !expenseForm.date}>Successful</Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Purchase Form Dialog */}
                <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)} fullWidth maxWidth="sm">
                    <form onSubmit={handleCreatePurchase}>
                        <DialogTitle>{purchaseForm.id ? 'Edit Purchase' : 'Log Inventory Purchase'}</DialogTitle>
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
                                            required
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
                                            select
                                            fullWidth
                                            label="Payment Status"
                                            value={purchaseForm.paymentStatus}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value })}
                                            SelectProps={{ native: true }}
                                        >
                                            <option value="Paid">Paid</option>
                                            <option value="Unpaid">Unpaid</option>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Note"
                                            multiline
                                            rows={3}
                                            value={purchaseForm.note}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
                            <Button variant="contained" type="submit" disabled={!purchaseForm.totalAmount}>Successful</Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </Box>
    );
};

export default ExpenseManagement;
