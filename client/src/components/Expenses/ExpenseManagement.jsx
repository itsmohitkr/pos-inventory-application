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
    Chip,
    Autocomplete,
    Menu
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Receipt as ReceiptIcon,
    LocalShipping as ShippingIcon,
    Edit as EditIcon,
    Payment as PaymentIcon,
    History as HistoryIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import api from '../../shared/api/api';

// Helper to get local date string YYYY-MM-DD
const getLocalTodayString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1).split('T')[0];
};

const splitIsoDate = (isoString) => isoString.split('T')[0];

const ExpenseManagement = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtering states
    const [dateFilter, setDateFilter] = useState('thisMonth');
    const [customDates, setCustomDates] = useState({ start: getLocalTodayString(), end: getLocalTodayString() });
    const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('All');
    const [purchaseVendorFilter, setPurchaseVendorFilter] = useState('All');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
    const [expenseSearchFilter, setExpenseSearchFilter] = useState('');
    const [purchaseSearchFilter, setPurchaseSearchFilter] = useState('');

    // Dialog states
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentHistoryDialogOpen, setPaymentHistoryDialogOpen] = useState(false);
    const [expensePaymentDialogOpen, setExpensePaymentDialogOpen] = useState(false); // New
    const [expensePaymentHistoryDialogOpen, setExpensePaymentHistoryDialogOpen] = useState(false); // New
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null); // New
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [deleteConfig, setDeleteConfig] = useState({ open: false, title: '', message: '', onConfirm: null });

    // Menu state
    const [paymentMenuAnchor, setPaymentMenuAnchor] = useState(null);

    // Form states
    const [expenseForm, setExpenseForm] = useState({
        id: null,
        amount: '',
        category: '',
        description: '',
        date: getLocalTodayString(),
        paidAmount: '', // New
        paymentMethod: 'Cash' // New
    });

    const [purchaseForm, setPurchaseForm] = useState({
        id: null,
        vendor: '',
        totalAmount: '',
        date: getLocalTodayString(),
        note: '',
        paidAmount: '',
        paymentMethod: 'Cash',
        items: []
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'Cash',
        date: getLocalTodayString(),
        note: ''
    });

    const [paymentEditDialogOpen, setPaymentEditDialogOpen] = useState(false);
    const [editPaymentForm, setEditPaymentForm] = useState({
        amount: '',
        paymentMethod: 'Cash',
        date: getLocalTodayString(),
        note: ''
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

    const fetchData = async (callback) => {
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
            if (callback) callback(sortedPur, sortedExp); // Pass both to callback
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenExpenseDialog = () => {
        setExpenseForm({ id: null, amount: '', category: '', description: '', date: getLocalTodayString(), paidAmount: '', paymentMethod: 'Cash' });
        setExpenseDialogOpen(true);
    };

    const handleOpenPurchaseDialog = () => {
        setPurchaseForm({ id: null, vendor: '', totalAmount: '', date: getLocalTodayString(), note: '', paidAmount: '', paymentMethod: 'Cash', items: [] });
        setPurchaseDialogOpen(true);
    };

    const handleEditExpense = (expense) => {
        setExpenseForm({
            id: expense.id,
            amount: expense.amount,
            category: expense.category,
            description: expense.description || '',
            date: new Date(expense.date).toISOString().split('T')[0],
            paymentMethod: expense.paymentMethod || 'Cash'
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
            paidAmount: purchase.totalPaid || 0,
            paymentMethod: purchase.paymentMethod || 'Cash',
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
                const submissionData = {
                    ...expenseForm,
                    amount: parseFloat(expenseForm.amount) || 0,
                    paidAmount: parseFloat(expenseForm.paidAmount) || 0
                };
                await api.post('/api/expenses', submissionData);
            }
            setExpenseDialogOpen(false);
            fetchData();
        } catch (err) {
            setError('Failed to save expense');
        }
    };

    const handleDeleteExpense = (id) => {
        setDeleteConfig({
            open: true,
            title: 'Confirm Delete Expense',
            message: 'Are you sure you want to delete this expense record?',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/expenses/${id}`);
                    fetchData();
                    setDeleteConfig(prev => ({ ...prev, open: false }));
                } catch (err) {
                    setError('Failed to delete expense');
                }
            }
        });
    };

    const handleCreatePurchase = async (e) => {
        if (e) e.preventDefault();
        try {
            const submissionData = {
                ...purchaseForm,
                totalAmount: parseFloat(purchaseForm.totalAmount) || 0,
                // When editing, totalAmount and paidAmount should not be changed via this form.
                // They are only set on initial creation or via payments.
                paidAmount: purchaseForm.id ? undefined : (parseFloat(purchaseForm.paidAmount) || 0),
                items: (purchaseForm.items || []).filter(item => item.productId && item.quantity)
            };

            if (purchaseForm.id) {
                // For existing purchases, only update vendor, date, note, items and preserve totalAmount.
                // paidAmount is managed separately.
                const { paidAmount, ...updateData } = submissionData;
                await api.put(`/api/purchases/${purchaseForm.id}`, updateData);
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

    const handleDeletePurchase = (id) => {
        setDeleteConfig({
            open: true,
            title: 'Confirm Delete Purchase',
            message: 'Are you sure you want to delete this purchase? This action cannot be undone and will affect inventory records.',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/purchases/${id}`);
                    fetchData();
                    setDeleteConfig(prev => ({ ...prev, open: false }));
                } catch (err) {
                    console.error('Delete error:', err);
                    setError('Failed to delete purchase');
                }
            }
        });
    };

    const handleOpenPaymentDialog = (purchase) => {
        setSelectedPurchase(purchase);
        setPaymentForm({
            amount: purchase.dueAmount || 0,
            paymentMethod: purchase.paymentMethod || 'Cash',
            date: getLocalTodayString(),
            note: ''
        });
        setPaymentDialogOpen(true);
    };

    const handleOpenPaymentHistoryDialog = (purchase) => {
        setSelectedPurchase(purchase);
        setPaymentHistoryDialogOpen(true);
    };

    const handleOpenPaymentMenu = (event, payment) => {
        setPaymentMenuAnchor(event.currentTarget);
        setSelectedPayment(payment);
    };

    const handleClosePaymentMenu = () => {
        setPaymentMenuAnchor(null);
    };

    const handleOpenEditPayment = () => {
        setEditPaymentForm({
            amount: selectedPayment.amount,
            paymentMethod: selectedPayment.paymentMethod || 'Cash',
            date: selectedPayment.date ? splitIsoDate(selectedPayment.date) : getLocalTodayString(),
            note: selectedPayment.note || ''
        });
        setPaymentEditDialogOpen(true);
        handleClosePaymentMenu();
    };

    const handleEditPaymentSubmission = async (e) => {
        if (e) e.preventDefault();
        try {
            const endpoint = selectedPurchase
                ? `/api/purchases/payments/${selectedPayment.id}`
                : `/api/expenses/payments/${selectedPayment.id}`;

            await api.put(endpoint, {
                amount: parseFloat(editPaymentForm.amount),
                paymentMethod: editPaymentForm.paymentMethod,
                date: editPaymentForm.date,
                note: editPaymentForm.note
            });
            setPaymentEditDialogOpen(false);
            fetchData((updatedPurchases, updatedExpenses) => {
                if (selectedPurchase) {
                    const refreshed = updatedPurchases.find(p => p.id === selectedPurchase.id);
                    if (refreshed) setSelectedPurchase(refreshed);
                } else if (selectedExpense) {
                    const refreshed = updatedExpenses.find(e => e.id === selectedExpense.id);
                    if (refreshed) setSelectedExpense(refreshed);
                }
            });
        } catch (err) {
            console.error('Payment edit error:', err);
            setError('Failed to update payment.');
        }
    };

    const handleDeletePaymentAction = (paymentId) => {
        setDeleteConfig({
            open: true,
            title: 'Confirm Delete Payment',
            message: 'Are you sure you want to delete this payment record?',
            onConfirm: async () => {
                try {
                    const endpoint = selectedPurchase
                        ? `/api/purchases/payments/${paymentId}`
                        : `/api/expenses/payments/${paymentId}`;

                    await api.delete(endpoint);
                    fetchData((updatedPurchases, updatedExpenses) => {
                        if (selectedPurchase) {
                            const refreshed = updatedPurchases.find(p => p.id === selectedPurchase.id);
                            if (refreshed) setSelectedPurchase(refreshed);
                        } else if (selectedExpense) {
                            const refreshed = updatedExpenses.find(e => e.id === selectedExpense.id);
                            if (refreshed) setSelectedExpense(refreshed);
                        }
                    });
                    setDeleteConfig(prev => ({ ...prev, open: false }));
                } catch (err) {
                    console.error('Payment delete error:', err);
                    setError('Failed to delete payment.');
                }
            }
        });
    };

    const handleCreatePayment = async (e) => {
        if (e) e.preventDefault();
        try {
            await api.post(`/api/purchases/${selectedPurchase.id}/payments`, {
                amount: parseFloat(paymentForm.amount),
                paymentMethod: paymentForm.paymentMethod,
                date: paymentForm.date,
                note: paymentForm.note
            });
            setPaymentDialogOpen(false);
            fetchData((updatedPurchases) => {
                const refreshed = updatedPurchases.find(p => p.id === selectedPurchase.id);
                if (refreshed) setSelectedPurchase(refreshed);
            });
        } catch (err) {
            console.error('Payment saving error:', err);
            setError('Failed to save payment.');
        }
    };

    const handleOpenExpensePaymentDialog = (expense) => {
        setSelectedExpense(expense);
        setPaymentForm({
            amount: expense.dueAmount || 0,
            paymentMethod: expense.paymentMethod || 'Cash',
            date: getLocalTodayString(),
            note: ''
        });
        setExpensePaymentDialogOpen(true);
    };

    const handleOpenExpensePaymentHistoryDialog = (expense) => {
        setSelectedExpense(expense);
        setExpensePaymentHistoryDialogOpen(true);
    };

    const handleCreateExpensePayment = async (e) => {
        if (e) e.preventDefault();
        try {
            await api.post(`/api/expenses/${selectedExpense.id}/payments`, {
                amount: parseFloat(paymentForm.amount),
                paymentMethod: paymentForm.paymentMethod,
                date: paymentForm.date,
                note: paymentForm.note
            });
            setExpensePaymentDialogOpen(false);
            fetchData((updatedData) => {
                // If fetchData doesn't separate, we might need to find by id in either
                // But fetchData usually sets both.
                // However, our fetchData expects a callback for Purchases specifically in some places?
                // Let's check fetchData again.
            });
        } catch (err) {
            console.error('Expense payment error:', err);
            setError('Failed to save expense payment.');
        }
    };

    // Need to handle edit/delete for expense payments too
    const handleEditExpensePayment = async (e) => {
        if (e) e.preventDefault();
        try {
            await api.put(`/api/expenses/payments/${selectedPayment.id}`, {
                amount: parseFloat(editPaymentForm.amount),
                paymentMethod: editPaymentForm.paymentMethod,
                date: editPaymentForm.date,
                note: editPaymentForm.note
            });
            setPaymentEditDialogOpen(false);
            fetchData();
        } catch (err) {
            setError('Failed to update expense payment.');
        }
    };

    const handleDeleteExpensePayment = (paymentId) => {
        setDeleteConfig({
            open: true,
            title: 'Confirm Delete Payment',
            message: 'Are you sure you want to delete this payment record?',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/expenses/payments/${paymentId}`);
                    fetchData();
                    setDeleteConfig(prev => ({ ...prev, open: false }));
                } catch (err) {
                    setError('Failed to delete expense payment.');
                }
            }
        });
    };

    // Derived totals
    const vendorOptions = Array.from(new Set(purchases.map(p => p.vendor).filter(Boolean)));

    // Filtering expenses
    const filteredExpenses = expenses.filter(e => {
        if (expenseCategoryFilter !== 'All' && e.category !== expenseCategoryFilter) return false;
        if (expenseSearchFilter && !e.description?.toLowerCase().includes(expenseSearchFilter.toLowerCase()) && !e.category.toLowerCase().includes(expenseSearchFilter.toLowerCase())) return false;
        return true;
    });

    // Filtering purchases
    const filteredPurchases = purchases.filter(p => {
        if (purchaseStatusFilter !== 'All' && p.paymentStatus !== purchaseStatusFilter) return false;
        if (purchaseVendorFilter !== 'All' && p.vendor !== purchaseVendorFilter) return false;
        if (purchaseSearchFilter) {
            const search = purchaseSearchFilter.toLowerCase();
            const vendorMatch = p.vendor?.toLowerCase().includes(search);
            const noteMatch = p.note?.toLowerCase().includes(search);
            if (!vendorMatch && !noteMatch) return false;
        }
        return true;
    });

    const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpensesDue = filteredExpenses.reduce((sum, e) => sum + (e.dueAmount || 0), 0); // New
    const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPurchasesDue = filteredPurchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);

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
                                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
                                    <Typography variant="h6">Operating Expenses</Typography>
                                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                        <TextField
                                            size="small"
                                            placeholder="Search description..."
                                            value={expenseSearchFilter}
                                            onChange={(e) => setExpenseSearchFilter(e.target.value)}
                                            sx={{ minWidth: 200 }}
                                        />
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Category</InputLabel>
                                            <Select
                                                value={expenseCategoryFilter}
                                                label="Category"
                                                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                                            >
                                                <MenuItem value="All">All Categories</MenuItem>
                                                {categories.map(cat => (
                                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenExpenseDialog}>
                                            Add Expense
                                        </Button>
                                    </Stack>
                                </Stack>

                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: "calc(100vh - 350px)", overflow: "auto" }}>
                                    <Table stickyHeader>
                                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>CATEGORY</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>DESCRIPTION</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>METHOD</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>AMOUNT</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>DUE</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredExpenses.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    onDoubleClick={() => handleOpenExpensePaymentHistoryDialog(row)}
                                                    sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
                                                >
                                                    <TableCell>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</TableCell>
                                                    <TableCell>{row.category}</TableCell>
                                                    <TableCell>{row.description}</TableCell>
                                                    <TableCell>{row.paymentMethod || 'Cash'}</TableCell>
                                                    <TableCell align="right">₹{row.amount.toLocaleString()}</TableCell>
                                                    <TableCell align="right">
                                                        {(row.dueAmount || 0) > 0 ? (
                                                            <Typography fontWeight="bold" color="error.main">₹{row.dueAmount.toLocaleString()}</Typography>
                                                        ) : (
                                                            <Typography color="text.secondary">-</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={row.paymentStatus || 'Paid'}
                                                            size="small"
                                                            color={
                                                                row.paymentStatus === 'Paid' ? 'success' :
                                                                    row.paymentStatus === 'Due' ? 'warning' : 'error'
                                                            }
                                                            sx={{ fontWeight: 'bold', minWidth: 70 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                            {(row.dueAmount || 0) > 0 && (
                                                                <Button
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleOpenExpensePaymentDialog(row)}
                                                                    sx={{
                                                                        flexDirection: 'column',
                                                                        fontSize: '0.65rem',
                                                                        minWidth: '60px',
                                                                        textTransform: 'none',
                                                                        lineHeight: 1.2,
                                                                        py: 0.5
                                                                    }}
                                                                >
                                                                    <PaymentIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} />
                                                                    Pay
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleEditExpense(row)}
                                                                sx={{
                                                                    flexDirection: 'column',
                                                                    fontSize: '0.65rem',
                                                                    minWidth: '50px',
                                                                    textTransform: 'none',
                                                                    lineHeight: 1.2,
                                                                    py: 0.5
                                                                }}
                                                            >
                                                                <EditIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteExpense(row.id)}
                                                                sx={{
                                                                    flexDirection: 'column',
                                                                    fontSize: '0.65rem',
                                                                    minWidth: '50px',
                                                                    textTransform: 'none',
                                                                    lineHeight: 1.2,
                                                                    py: 0.5
                                                                }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} />
                                                                Delete
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredExpenses.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center">No expenses match criteria</TableCell>
                                                </TableRow>
                                            )}
                                            {/* Highlighted Total Row */}
                                            {filteredExpenses.length > 0 && (
                                                <TableRow sx={{ bgcolor: '#f1f5f9', position: 'sticky', bottom: 0, zIndex: 1 }}>
                                                    <TableCell colSpan={4} sx={{ py: 1.5 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold" textAlign="right" color="primary.dark">
                                                            Total Current Period
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                                        <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                                            ₹{totalExpensesAmount.toLocaleString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                                        <Typography variant="h6" fontWeight="bold" color="error.dark">
                                                            ₹{totalExpensesDue.toLocaleString()}
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

                        {activeTab === 1 && (
                            <Box>
                                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
                                    <Typography variant="h6">Inventory Purchases</Typography>
                                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                        <TextField
                                            size="small"
                                            placeholder="Search vendor or note..."
                                            value={purchaseSearchFilter}
                                            onChange={(e) => setPurchaseSearchFilter(e.target.value)}
                                            sx={{ minWidth: 200 }}
                                        />
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={purchaseStatusFilter}
                                                label="Status"
                                                onChange={(e) => setPurchaseStatusFilter(e.target.value)}
                                            >
                                                <MenuItem value="All">All Statuses</MenuItem>
                                                <MenuItem value="Paid">Paid</MenuItem>
                                                <MenuItem value="Due">Due</MenuItem>
                                                <MenuItem value="Unpaid">Unpaid</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Autocomplete
                                            size="small"
                                            sx={{ minWidth: 150 }}
                                            options={['All', ...vendorOptions]}
                                            value={purchaseVendorFilter}
                                            onChange={(e, val) => setPurchaseVendorFilter(val || 'All')}
                                            renderInput={(params) => <TextField {...params} label="Vendor" />}
                                        />
                                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenPurchaseDialog}>
                                            Log Purchase
                                        </Button>
                                    </Stack>
                                </Stack>

                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: "calc(100vh - 350px)", overflow: "auto" }}>
                                    <Table stickyHeader>
                                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>VENDOR</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>METHOD</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>NOTE</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>AMOUNT</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>DUE</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredPurchases.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    onDoubleClick={() => handleOpenPaymentHistoryDialog(row)}
                                                    sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
                                                >
                                                    <TableCell>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</TableCell>
                                                    <TableCell>{row.vendor || 'N/A'}</TableCell>
                                                    <TableCell>{row.paymentMethod || 'Cash'}</TableCell>
                                                    <TableCell>{row.note}</TableCell>
                                                    <TableCell align="right">₹{row.totalAmount.toLocaleString()}</TableCell>
                                                    <TableCell align="right">
                                                        {row.dueAmount > 0 ? (
                                                            <Typography fontWeight="bold" color="error.main">₹{row.dueAmount.toLocaleString()}</Typography>
                                                        ) : (
                                                            <Typography color="text.secondary">-</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={row.paymentStatus || 'Paid'}
                                                            size="small"
                                                            color={
                                                                row.paymentStatus === 'Paid' ? 'success' :
                                                                    row.paymentStatus === 'Due' ? 'warning' : 'error'
                                                            }
                                                            sx={{ fontWeight: 'bold', minWidth: 70 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                            {row.dueAmount > 0 && (
                                                                <Button
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleOpenPaymentDialog(row)}
                                                                    sx={{
                                                                        flexDirection: 'column',
                                                                        fontSize: '0.65rem',
                                                                        minWidth: '60px',
                                                                        textTransform: 'none',
                                                                        lineHeight: 1.2,
                                                                        py: 0.5
                                                                    }}
                                                                >
                                                                    <PaymentIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} />
                                                                    Pay
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleEditPurchase(row)}
                                                                sx={{
                                                                    flexDirection: 'column',
                                                                    fontSize: '0.65rem',
                                                                    minWidth: '50px',
                                                                    textTransform: 'none',
                                                                    lineHeight: 1.2,
                                                                    py: 0.5
                                                                }}
                                                            >
                                                                <EditIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeletePurchase(row.id)}
                                                                sx={{
                                                                    flexDirection: 'column',
                                                                    fontSize: '0.65rem',
                                                                    minWidth: '50px',
                                                                    textTransform: 'none',
                                                                    lineHeight: 1.2,
                                                                    py: 0.5
                                                                }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} />
                                                                Delete
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredPurchases.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center">No purchases match criteria</TableCell>
                                                </TableRow>
                                            )}
                                            {/* Highlighted Total Row */}
                                            {filteredPurchases.length > 0 && (
                                                <TableRow sx={{ bgcolor: 'rgba(242, 181, 68, 0.1)', position: 'sticky', bottom: 0, zIndex: 1 }}>
                                                    <TableCell colSpan={4} sx={{ py: 1.5 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold" textAlign="right" color="primary.dark">
                                                            Total Current Period
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                                        <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                                            ₹{totalPurchasesAmount.toLocaleString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                                        <Typography variant="h6" fontWeight="bold" color="error.main">
                                                            ₹{totalPurchasesDue.toLocaleString()}
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
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                        <TextField
                                            sx={{ flex: 1 }}
                                            required
                                            label="Amount"
                                            type="number"
                                            value={expenseForm.amount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        />
                                        <Autocomplete
                                            sx={{ flex: 1 }}
                                            freeSolo
                                            options={categories}
                                            value={expenseForm.category}
                                            onChange={(event, newValue) => {
                                                setExpenseForm({ ...expenseForm, category: newValue || '' });
                                            }}
                                            onInputChange={(event, newInputValue) => {
                                                setExpenseForm({ ...expenseForm, category: newInputValue });
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    required
                                                    label="Expenses for?"
                                                    placeholder="Enter category details..."
                                                />
                                            )}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                        <TextField
                                            sx={{ flex: 1 }}
                                            required
                                            label="Date"
                                            type="date"
                                            value={expenseForm.date}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                            sx={{ flex: 1 }}
                                            label="Amount Paid Now"
                                            type="number"
                                            disabled={!!expenseForm.id}
                                            inputProps={{ min: 0, max: expenseForm.amount || 0, step: "0.01" }}
                                            value={expenseForm.paidAmount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, paidAmount: e.target.value })}
                                            helperText={
                                                expenseForm.amount && !expenseForm.id
                                                    ? `Due: ₹${Math.max(0, (parseFloat(expenseForm.amount) || 0) - (parseFloat(expenseForm.paidAmount) || 0)).toLocaleString()}`
                                                    : ''
                                            }
                                        />
                                        <TextField
                                            sx={{ flex: 1 }}
                                            select
                                            label="Method"
                                            value={expenseForm.paymentMethod}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                            SelectProps={{ native: true }}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </TextField>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        multiline
                                        rows={3}
                                        value={expenseForm.description}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="contained"
                                type="submit"
                                disabled={!expenseForm.amount || !expenseForm.category || !expenseForm.date}
                                sx={{
                                    color: '#ffffff',
                                    bgcolor: '#0b1d39',
                                    '&:hover': { bgcolor: '#1a365d' },
                                    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.5)', bgcolor: 'rgba(11, 29, 57, 0.5)' }
                                }}
                            >
                                Successful
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Purchase Form Dialog */}
                <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)} fullWidth maxWidth="sm">
                    <form onSubmit={handleCreatePurchase}>
                        <DialogTitle>{purchaseForm.id ? 'Edit Purchase' : 'Log Inventory Purchase'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                        <Autocomplete
                                            sx={{ flex: 1 }}
                                            freeSolo
                                            options={vendorOptions}
                                            value={purchaseForm.vendor}
                                            onChange={(event, newValue) => {
                                                setPurchaseForm({ ...purchaseForm, vendor: newValue || '' });
                                            }}
                                            onInputChange={(event, newInputValue) => {
                                                setPurchaseForm({ ...purchaseForm, vendor: newInputValue });
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Vendor Name"
                                                />
                                            )}
                                        />
                                        <TextField
                                            sx={{ flex: 1 }}
                                            required
                                            disabled={!!purchaseForm.id}
                                            label="Total Amount"
                                            type="number"
                                            value={purchaseForm.totalAmount}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                        <TextField
                                            sx={{ flex: 1 }}
                                            label="Date"
                                            type="date"
                                            value={purchaseForm.date}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                            sx={{ flex: 1 }}
                                            label="Amount Paid Now"
                                            type="number"
                                            disabled={!!purchaseForm.id}
                                            inputProps={{ min: 0, max: purchaseForm.totalAmount || 0, step: "0.01" }}
                                            value={purchaseForm.paidAmount}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, paidAmount: e.target.value })}
                                            helperText={
                                                purchaseForm.totalAmount && !purchaseForm.id
                                                    ? `Due: ₹${Math.max(0, (parseFloat(purchaseForm.totalAmount) || 0) - (parseFloat(purchaseForm.paidAmount) || 0)).toLocaleString()}`
                                                    : ''
                                            }
                                        />
                                        <TextField
                                            sx={{ flex: 1 }}
                                            select
                                            label="Method"
                                            value={purchaseForm.paymentMethod}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}
                                            SelectProps={{ native: true }}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </TextField>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label="Note"
                                        multiline
                                        rows={3}
                                        value={purchaseForm.note}
                                        onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="contained"
                                type="submit"
                                disabled={!purchaseForm.totalAmount}
                                sx={{
                                    color: '#ffffff',
                                    bgcolor: '#0b1d39',
                                    '&:hover': { bgcolor: '#1a365d' },
                                    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.5)', bgcolor: 'rgba(11, 29, 57, 0.5)' }
                                }}
                            >
                                Successful
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Make Payment Dialog */}
                <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} fullWidth maxWidth="xs">
                    <form onSubmit={handleCreatePayment}>
                        <DialogTitle>Make Payment</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {selectedPurchase && (
                                    <Box sx={{ mb: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Total Amount: ₹{selectedPurchase.totalAmount.toLocaleString()}</Typography>
                                        <Typography variant="body1" fontWeight="bold" color="error.main">Due Amount: ₹{selectedPurchase.dueAmount?.toLocaleString()}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        required
                                        sx={{ flex: 2 }}
                                        label="Payment Amount"
                                        type="number"
                                        inputProps={{ max: selectedPurchase?.dueAmount || 0, step: "0.01" }}
                                        value={paymentForm.amount}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    />
                                    <TextField
                                        required
                                        sx={{ flex: 1 }}
                                        select
                                        label="Method"
                                        value={paymentForm.paymentMethod}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </TextField>
                                </Box>
                                <TextField
                                    required
                                    fullWidth
                                    label="Payment Date"
                                    type="date"
                                    inputProps={{ min: selectedPurchase?.date ? splitIsoDate(selectedPurchase.date) : "" }}
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="Note (Optional)"
                                    multiline
                                    rows={2}
                                    value={paymentForm.note}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="contained"
                                type="submit"
                                color="success"
                                disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0 || parseFloat(paymentForm.amount) > (selectedPurchase?.dueAmount || 0)}
                            >
                                Record Payment
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Payment History Dialog */}
                <Dialog open={paymentHistoryDialogOpen} onClose={() => setPaymentHistoryDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" /> Payment History
                    </DialogTitle>
                    <DialogContent dividers>
                        {selectedPurchase && (
                            <Box>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                                        <Typography variant="h6" fontWeight="bold">₹{selectedPurchase.totalAmount.toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                                        <Typography variant="h6" fontWeight="bold" color="success.main">₹{selectedPurchase.totalPaid?.toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Due Amount</Typography>
                                        <Typography variant="h6" fontWeight="bold" color="error.main">₹{selectedPurchase.dueAmount?.toLocaleString()}</Typography>
                                    </Box>
                                </Stack>

                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Recorded Payments</Typography>
                                {selectedPurchase.payments && selectedPurchase.payments.length > 0 ? (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                                <TableRow>
                                                    <TableCell>Date & Time</TableCell>
                                                    <TableCell>Method</TableCell>
                                                    <TableCell>Note</TableCell>
                                                    <TableCell align="right">Amount</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...(selectedPurchase.payments || [])].reverse().map((payment, index) => {
                                                    const isMostRecent = index === 0;
                                                    return (
                                                        <TableRow key={payment.id}>
                                                            <TableCell>{new Date(payment.date).toLocaleString('en-GB', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit', hour12: true
                                                            })}</TableCell>
                                                            <TableCell>{payment.paymentMethod || 'Cash'}</TableCell>
                                                            <TableCell>{payment.note || '-'}</TableCell>
                                                            <TableCell align="right">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                                    <Typography sx={{ fontWeight: 'medium', color: 'success.main' }}>
                                                                        ₹{payment.amount.toLocaleString()}
                                                                    </Typography>
                                                                    <IconButton size="small" onClick={(e) => handleOpenPaymentMenu(e, payment)}>
                                                                        <MoreVertIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                                        No payment records found.
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPaymentHistoryDialogOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Payment Action Menu */}
                <Menu
                    anchorEl={paymentMenuAnchor}
                    open={Boolean(paymentMenuAnchor)}
                    onClose={handleClosePaymentMenu}
                >
                    <MenuItem
                        onClick={handleOpenEditPayment}
                        disabled={
                            selectedPurchase
                                ? (!selectedPurchase.payments?.length || !selectedPayment || selectedPurchase.payments[selectedPurchase.payments.length - 1]?.id !== selectedPayment.id)
                                : (!selectedExpense?.payments?.length || !selectedPayment || selectedExpense.payments[selectedExpense.payments.length - 1]?.id !== selectedPayment.id)
                        }
                    >
                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                    </MenuItem>
                    <MenuItem
                        onClick={() => { handleDeletePaymentAction(selectedPayment.id); handleClosePaymentMenu(); }}
                        disabled={
                            selectedPurchase
                                ? (!selectedPurchase.payments?.length || !selectedPayment || selectedPurchase.payments[selectedPurchase.payments.length - 1]?.id !== selectedPayment.id)
                                : (!selectedExpense?.payments?.length || !selectedPayment || selectedExpense.payments[selectedExpense.payments.length - 1]?.id !== selectedPayment.id)
                        }
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                </Menu>

                {/* Edit Payment Sub-Dialog */}
                <Dialog open={paymentEditDialogOpen} onClose={() => setPaymentEditDialogOpen(false)} fullWidth maxWidth="xs">
                    <form onSubmit={handleEditPaymentSubmission}>
                        <DialogTitle>Edit Payment Record</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        required
                                        sx={{ flex: 2 }}
                                        label="Amount"
                                        type="number"
                                        value={editPaymentForm.amount}
                                        onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                                    />
                                    <TextField
                                        required
                                        sx={{ flex: 1 }}
                                        select
                                        label="Method"
                                        value={editPaymentForm.paymentMethod}
                                        onChange={(e) => setEditPaymentForm({ ...editPaymentForm, paymentMethod: e.target.value })}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </TextField>
                                </Box>
                                <TextField
                                    required
                                    label="Date"
                                    type="date"
                                    inputProps={{ min: selectedPurchase?.date ? splitIsoDate(selectedPurchase.date) : "" }}
                                    value={editPaymentForm.date}
                                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Note"
                                    multiline
                                    rows={2}
                                    value={editPaymentForm.note}
                                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setPaymentEditDialogOpen(false)}>Cancel</Button>
                            <Button variant="contained" type="submit" color="primary">Update Payment</Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Custom Delete Confirmation Dialog */}
                <Dialog
                    open={deleteConfig.open}
                    onClose={() => setDeleteConfig({ ...deleteConfig, open: false })}
                >
                    <DialogTitle>{deleteConfig.title}</DialogTitle>
                    <DialogContent>
                        <Typography>{deleteConfig.message}</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfig({ ...deleteConfig, open: false })}>Cancel</Button>
                        <Button
                            onClick={() => {
                                if (deleteConfig.onConfirm) deleteConfig.onConfirm();
                            }}
                            color="error"
                            variant="contained"
                            sx={{ color: '#fff' }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Expense Payment Dialog */}
                <Dialog open={expensePaymentDialogOpen} onClose={() => setExpensePaymentDialogOpen(false)} fullWidth maxWidth="xs">
                    <form onSubmit={handleCreateExpensePayment}>
                        <DialogTitle>Record Expense Payment</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {selectedExpense && (
                                    <Box sx={{ mb: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Total Expense: ₹{selectedExpense.amount.toLocaleString()}</Typography>
                                        <Typography variant="body1" fontWeight="bold" color="error.main">Due Amount: ₹{selectedExpense.dueAmount?.toLocaleString()}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        required
                                        sx={{ flex: 2 }}
                                        label="Payment Amount"
                                        type="number"
                                        inputProps={{ max: selectedExpense?.dueAmount || 0, step: "0.01" }}
                                        value={paymentForm.amount}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    />
                                    <TextField
                                        required
                                        sx={{ flex: 1 }}
                                        select
                                        label="Method"
                                        value={paymentForm.paymentMethod}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </TextField>
                                </Box>
                                <TextField
                                    required
                                    fullWidth
                                    label="Payment Date"
                                    type="date"
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="Note (Optional)"
                                    multiline
                                    rows={2}
                                    value={paymentForm.note}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setExpensePaymentDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="contained"
                                type="submit"
                                color="success"
                                disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0 || parseFloat(paymentForm.amount) > (selectedExpense?.dueAmount || 0)}
                            >
                                Record Payment
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Expense Payment History Dialog */}
                <Dialog open={expensePaymentHistoryDialogOpen} onClose={() => setExpensePaymentHistoryDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" /> Expense Payment History
                    </DialogTitle>
                    <DialogContent dividers>
                        {selectedExpense && (
                            <Box>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                                        <Typography variant="h6" fontWeight="bold">₹{selectedExpense.amount.toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                                        <Typography variant="h6" fontWeight="bold" color="success.main">₹{selectedExpense.totalPaid?.toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Due Amount</Typography>
                                        <Typography variant="h6" fontWeight="bold" color="error.main">₹{selectedExpense.dueAmount?.toLocaleString()}</Typography>
                                    </Box>
                                </Stack>

                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Recorded Payments</Typography>
                                {selectedExpense.payments && selectedExpense.payments.length > 0 ? (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                                <TableRow>
                                                    <TableCell>Date & Time</TableCell>
                                                    <TableCell>Method</TableCell>
                                                    <TableCell>Note</TableCell>
                                                    <TableCell align="right">Amount</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...(selectedExpense.payments || [])].reverse().map((payment, index) => {
                                                    return (
                                                        <TableRow key={payment.id}>
                                                            <TableCell>{new Date(payment.date).toLocaleString('en-GB', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit', hour12: true
                                                            })}</TableCell>
                                                            <TableCell>{payment.paymentMethod || 'Cash'}</TableCell>
                                                            <TableCell>{payment.note || '-'}</TableCell>
                                                            <TableCell align="right">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                                    <Typography sx={{ fontWeight: 'medium', color: 'success.main' }}>
                                                                        ₹{payment.amount.toLocaleString()}
                                                                    </Typography>
                                                                    <IconButton size="small" onClick={(e) => {
                                                                        setSelectedPurchase(null);
                                                                        handleOpenPaymentMenu(e, payment);
                                                                    }}>
                                                                        <MoreVertIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                                        No payment records found.
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setExpensePaymentHistoryDialogOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default ExpenseManagement;
