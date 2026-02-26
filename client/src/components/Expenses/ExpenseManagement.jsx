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
    LocalShipping as ShippingIcon,
    Assessment as ProfitIcon
} from '@mui/icons-material';
import api from '../../api';

const ExpenseManagement = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Dialog states
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    // Form states
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        category: 'Misc',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [purchaseForm, setPurchaseForm] = useState({
        vendor: '',
        totalAmount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        items: []
    });

    const categories = ['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, purRes] = await Promise.all([
                api.get('/api/expenses'),
                api.get('/api/purchases')
            ]);
            setExpenses(expRes.data);
            setPurchases(purRes.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async () => {
        try {
            await api.post('/api/expenses', expenseForm);
            setExpenseDialogOpen(false);
            fetchData();
            setExpenseForm({ amount: '', category: 'Misc', description: '', date: new Date().toISOString().split('T')[0] });
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
            // Ensure numbers are handled correctly and items are filtered
            const submissionData = {
                ...purchaseForm,
                totalAmount: parseFloat(purchaseForm.totalAmount) || 0,
                items: (purchaseForm.items || []).filter(item => item.productId && item.quantity)
            };

            await api.post('/api/purchases', submissionData);
            setPurchaseDialogOpen(false);
            fetchData();
            setPurchaseForm({
                vendor: '',
                totalAmount: '',
                date: new Date().toISOString().split('T')[0],
                note: '',
                items: []
            });
        } catch (err) {
            console.error('Purchase creation error:', err);
            setError('Failed to create purchase. Please check your inputs.');
        }
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Financial Tracking
            </Typography>

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
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setExpenseDialogOpen(true)}>
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
                                                <TableCell colSpan={5} align="center">No expenses found</TableCell>
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
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setPurchaseDialogOpen(true)}>
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
                                                <TableCell colSpan={4} align="center">No purchases recorded</TableCell>
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
