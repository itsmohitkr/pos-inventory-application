import React, { useState, useEffect, useCallback } from 'react';
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
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import posService from '../../shared/api/posService';
import ExpenseFormDialog from './ExpenseFormDialog';
import PurchaseFormDialog from './PurchaseFormDialog';
import RecordPaymentDialog from './RecordPaymentDialog';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import PaymentActionMenu from './PaymentActionMenu';

// Helper to get local date string YYYY-MM-DD
const getLocalTodayString = () => {
  const tzoffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().slice(0, -1).split('T')[0];
};

const splitIsoDate = (isoString) => isoString.split('T')[0];

const ExpenseManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState(null);

  // Filtering states
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [customDates, setCustomDates] = useState({
    start: getLocalTodayString(),
    end: getLocalTodayString(),
  });
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
  const [deleteConfig, setDeleteConfig] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

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
    paymentMethod: 'Cash', // New
  });

  const [purchaseForm, setPurchaseForm] = useState({
    id: null,
    vendor: '',
    totalAmount: '',
    date: getLocalTodayString(),
    note: '',
    paidAmount: '',
    paymentMethod: 'Cash',
    items: [],
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    date: getLocalTodayString(),
    note: '',
  });

  const [paymentEditDialogOpen, setPaymentEditDialogOpen] = useState(false);
  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    date: getLocalTodayString(),
    note: '',
  });

  const categories = ['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc'];

  const getDateRange = useCallback(
    (type) => {
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
          const start = customDates.start
            ? (() => {
              const [y, m, d] = customDates.start.split('-').map(Number);
              return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
            })()
            : undefined;

          const end = customDates.end
            ? (() => {
              const [y, m, d] = customDates.end.split('-').map(Number);
              return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
            })()
            : undefined;

          return { startDate: start, endDate: end };
        }
        default:
          return {};
      }
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    },
    [customDates]
  );

  const fetchData = useCallback(
    async (callback) => {
      setError(null);
      try {
        const range = getDateRange(dateFilter);
        const { startDate, endDate } = range;

        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const [expensesData, purchasesData] = await Promise.all([
          posService.fetchExpenses(params),
          posService.fetchPurchases(params),
        ]);
        const sortedExp = expensesData.sort((a, b) => {
          if (a.date === b.date) return b.id - a.id;
          return new Date(b.date) - new Date(a.date);
        });
        const sortedPur = purchasesData.sort((a, b) => {
          if (a.date === b.date) return b.id - a.id;
          return new Date(b.date) - new Date(a.date);
        });
        setExpenses(sortedExp);
        setPurchases(sortedPur);
        if (callback) callback(sortedPur, sortedExp); // Pass both to callback
      } catch {
        setError('Failed to fetch data');
      } finally {
        // Data fetch attempt finished
      }
    },
    [dateFilter, getDateRange]
  );

  useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchData();
    }
  }, [dateFilter, fetchData]);

  const handleOpenExpenseDialog = () => {
    setExpenseForm({
      id: null,
      amount: '',
      category: '',
      description: '',
      date: getLocalTodayString(),
      paidAmount: '',
      paymentMethod: 'Cash',
    });
    setExpenseDialogOpen(true);
  };

  const handleOpenPurchaseDialog = () => {
    setPurchaseForm({
      id: null,
      vendor: '',
      totalAmount: '',
      date: getLocalTodayString(),
      note: '',
      paidAmount: '',
      paymentMethod: 'Cash',
      items: [],
    });
    setPurchaseDialogOpen(true);
  };

  const handleEditExpense = (expense) => {
    setExpenseForm({
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod || 'Cash',
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
      items: purchase.items || [],
    });
    setPurchaseDialogOpen(true);
  };

  const handleCreateExpense = async (e) => {
    if (e) e.preventDefault();
    try {
      if (expenseForm.id) {
        await posService.updateExpense(expenseForm.id, expenseForm);
      } else {
        const submissionData = {
          ...expenseForm,
          amount: parseFloat(expenseForm.amount) || 0,
          paidAmount: parseFloat(expenseForm.paidAmount) || 0,
        };
        await posService.createExpense(submissionData);
      }
      setExpenseDialogOpen(false);
      fetchData();
    } catch {
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
          await posService.deleteExpense(id);
          fetchData();
          setDeleteConfig((prev) => ({ ...prev, open: false }));
        } catch {
          setError('Failed to delete expense');
        }
      },
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
        paidAmount: purchaseForm.id ? undefined : parseFloat(purchaseForm.paidAmount) || 0,
        items: (purchaseForm.items || []).filter((item) => item.productId && item.quantity),
      };

      if (purchaseForm.id) {
        // For existing purchases, only update vendor, date, note, items and preserve totalAmount.
        // paidAmount is managed separately.
        const { paidAmount: _paidAmount, ...updateData } = submissionData;
        await posService.updatePurchase(purchaseForm.id, updateData);
      } else {
        await posService.createPurchase(submissionData);
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
      message:
        'Are you sure you want to delete this purchase? This action cannot be undone and will affect inventory records.',
      onConfirm: async () => {
        try {
          await posService.deletePurchase(id);
          fetchData();
          setDeleteConfig((prev) => ({ ...prev, open: false }));
        } catch (err) {
          console.error('Delete error:', err);
          setError('Failed to delete purchase');
        }
      },
    });
  };

  const handleOpenPaymentDialog = (purchase) => {
    setSelectedPurchase(purchase);
    setPaymentForm({
      amount: purchase.dueAmount || 0,
      paymentMethod: purchase.paymentMethod || 'Cash',
      date: getLocalTodayString(),
      note: '',
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
      note: selectedPayment.note || '',
    });
    setPaymentEditDialogOpen(true);
    handleClosePaymentMenu();
  };

  const handleEditPaymentSubmission = async (e) => {
    if (e) e.preventDefault();
    try {
      if (selectedPurchase) {
        await posService.updatePurchasePayment(selectedPayment.id, {
          amount: parseFloat(editPaymentForm.amount),
          paymentMethod: editPaymentForm.paymentMethod,
          date: editPaymentForm.date,
          note: editPaymentForm.note,
        });
      } else {
        await posService.updateExpensePayment(selectedPayment.id, {
          amount: parseFloat(editPaymentForm.amount),
          paymentMethod: editPaymentForm.paymentMethod,
          date: editPaymentForm.date,
          note: editPaymentForm.note,
        });
      }
      setPaymentEditDialogOpen(false);
      fetchData((updatedPurchases, updatedExpenses) => {
        if (selectedPurchase) {
          const refreshed = updatedPurchases.find((p) => p.id === selectedPurchase.id);
          if (refreshed) setSelectedPurchase(refreshed);
        } else if (selectedExpense) {
          const refreshed = updatedExpenses.find((e) => e.id === selectedExpense.id);
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
          if (selectedPurchase) {
            await posService.deletePurchasePayment(paymentId);
          } else {
            await posService.deleteExpensePayment(paymentId);
          }
          fetchData((updatedPurchases, updatedExpenses) => {
            if (selectedPurchase) {
              const refreshed = updatedPurchases.find((p) => p.id === selectedPurchase.id);
              if (refreshed) setSelectedPurchase(refreshed);
            } else if (selectedExpense) {
              const refreshed = updatedExpenses.find((e) => e.id === selectedExpense.id);
              if (refreshed) setSelectedExpense(refreshed);
            }
          });
          setDeleteConfig((prev) => ({ ...prev, open: false }));
        } catch (err) {
          console.error('Payment delete error:', err);
          setError('Failed to delete payment.');
        }
      },
    });
  };

  const handleCreatePayment = async (e) => {
    if (e) e.preventDefault();
    try {
      await posService.createPurchasePayment(selectedPurchase.id, {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        date: paymentForm.date,
        note: paymentForm.note,
      });
      setPaymentDialogOpen(false);
      fetchData((updatedPurchases) => {
        const refreshed = updatedPurchases.find((p) => p.id === selectedPurchase.id);
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
      note: '',
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
      await posService.createExpensePayment(selectedExpense.id, {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        date: paymentForm.date,
        note: paymentForm.note,
      });
      setExpensePaymentDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Expense payment error:', err);
      setError('Failed to save expense payment.');
    }
  };

  // Need to handle edit/delete for expense payments too
  const _handleEditExpensePayment = async (e) => {
    if (e) e.preventDefault();
    try {
      await posService.updateExpensePayment(selectedPayment.id, {
        amount: parseFloat(editPaymentForm.amount),
        paymentMethod: editPaymentForm.paymentMethod,
        date: editPaymentForm.date,
        note: editPaymentForm.note,
      });
      setPaymentEditDialogOpen(false);
      fetchData();
    } catch {
      setError('Failed to update expense payment.');
    }
  };

  const _handleDeleteExpensePayment = (paymentId) => {
    setDeleteConfig({
      open: true,
      title: 'Confirm Delete Payment',
      message: 'Are you sure you want to delete this payment record?',
      onConfirm: async () => {
        try {
          await posService.deleteExpensePayment(paymentId);
          fetchData();
          setDeleteConfig((prev) => ({ ...prev, open: false }));
        } catch {
          setError('Failed to delete expense payment.');
        }
      },
    });
  };

  // Derived totals
  const vendorOptions = Array.from(new Set(purchases.map((p) => p.vendor).filter(Boolean)));

  // Filtering expenses
  const filteredExpenses = expenses.filter((e) => {
    if (expenseCategoryFilter !== 'All' && e.category !== expenseCategoryFilter) return false;
    if (
      expenseSearchFilter &&
      !e.description?.toLowerCase().includes(expenseSearchFilter.toLowerCase()) &&
      !e.category.toLowerCase().includes(expenseSearchFilter.toLowerCase())
    )
      return false;
    return true;
  });

  // Filtering purchases
  const filteredPurchases = purchases.filter((p) => {
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
        bgcolor: 'background.default',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          m: 3,
          px: 4,
          py: 2.5,
          background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)',
          borderBottom: '1px solid rgba(16, 24, 40, 0.08)',
          flexShrink: 0,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}
            >
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
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<ReceiptIcon />} iconPosition="start" label="Expenses" />
            <Tab icon={<ShippingIcon />} iconPosition="start" label="Inventory Purchases" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {activeTab === 0 && (
              <Box>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  spacing={2}
                  sx={{ mb: 2 }}
                >
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
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenExpenseDialog}
                    >
                      Add Expense
                    </Button>
                  </Stack>
                </Stack>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}
                >
                  <Table stickyHeader>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>CATEGORY</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>DESCRIPTION</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>METHOD</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          AMOUNT
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          DUE
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>
                          STATUS
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>
                          ACTIONS
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredExpenses.map((row) => (
                        <TableRow
                          key={row.id}
                          onDoubleClick={() => handleOpenExpensePaymentHistoryDialog(row)}
                          sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
                        >
                          <TableCell>
                            {new Date(row.date)
                              .toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                              .replace(/\//g, '-')}
                          </TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>{row.paymentMethod || 'Cash'}</TableCell>
                          <TableCell align="right">₹{row.amount.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {(row.dueAmount || 0) > 0 ? (
                              <Typography fontWeight="bold" color="error.main">
                                ₹{row.dueAmount.toLocaleString()}
                              </Typography>
                            ) : (
                              <Typography color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={row.paymentStatus || 'Paid'}
                              size="small"
                              color={
                                row.paymentStatus === 'Paid'
                                  ? 'success'
                                  : row.paymentStatus === 'Due'
                                    ? 'warning'
                                    : 'error'
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
                                    py: 0.5,
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
                                  py: 0.5,
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
                                  py: 0.5,
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
                          <TableCell colSpan={8} align="center">
                            No expenses match criteria
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Highlighted Total Row */}
                      {filteredExpenses.length > 0 && (
                        <TableRow
                          sx={{ bgcolor: '#f1f5f9', position: 'sticky', bottom: 0, zIndex: 1 }}
                        >
                          <TableCell colSpan={4} sx={{ py: 1.5 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              textAlign="right"
                              color="primary.dark"
                            >
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
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  spacing={2}
                  sx={{ mb: 2 }}
                >
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
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenPurchaseDialog}
                    >
                      Log Purchase
                    </Button>
                  </Stack>
                </Stack>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}
                >
                  <Table stickyHeader>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>VENDOR</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>METHOD</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>NOTE</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          AMOUNT
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          DUE
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>
                          STATUS
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>
                          ACTIONS
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPurchases.map((row) => (
                        <TableRow
                          key={row.id}
                          onDoubleClick={() => handleOpenPaymentHistoryDialog(row)}
                          sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
                        >
                          <TableCell>
                            {new Date(row.date)
                              .toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                              .replace(/\//g, '-')}
                          </TableCell>
                          <TableCell>{row.vendor || 'N/A'}</TableCell>
                          <TableCell>{row.paymentMethod || 'Cash'}</TableCell>
                          <TableCell>{row.note}</TableCell>
                          <TableCell align="right">₹{row.totalAmount.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {row.dueAmount > 0 ? (
                              <Typography fontWeight="bold" color="error.main">
                                ₹{row.dueAmount.toLocaleString()}
                              </Typography>
                            ) : (
                              <Typography color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={row.paymentStatus || 'Paid'}
                              size="small"
                              color={
                                row.paymentStatus === 'Paid'
                                  ? 'success'
                                  : row.paymentStatus === 'Due'
                                    ? 'warning'
                                    : 'error'
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
                                    py: 0.5,
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
                                  py: 0.5,
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
                                  py: 0.5,
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
                          <TableCell colSpan={8} align="center">
                            No purchases match criteria
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Highlighted Total Row */}
                      {filteredPurchases.length > 0 && (
                        <TableRow
                          sx={{
                            bgcolor: 'rgba(242, 181, 68, 0.1)',
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 1,
                          }}
                        >
                          <TableCell colSpan={4} sx={{ py: 1.5 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              textAlign="right"
                              color="primary.dark"
                            >
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
        <ExpenseFormDialog
          open={expenseDialogOpen}
          onClose={() => setExpenseDialogOpen(false)}
          onSubmit={handleCreateExpense}
          expenseForm={expenseForm}
          onFormChange={(updates) => setExpenseForm((prev) => ({ ...prev, ...updates }))}
          categories={categories}
        />

        {/* Purchase Form Dialog */}
        <PurchaseFormDialog
          open={purchaseDialogOpen}
          onClose={() => setPurchaseDialogOpen(false)}
          onSubmit={handleCreatePurchase}
          purchaseForm={purchaseForm}
          onFormChange={(updates) => setPurchaseForm((prev) => ({ ...prev, ...updates }))}
          vendorOptions={vendorOptions}
        />

        {/* Make Payment Dialog */}
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          onSubmit={handleCreatePayment}
          title="Make Payment"
          totalLabel="Total Amount"
          totalValue={selectedPurchase?.totalAmount}
          dueAmount={selectedPurchase?.dueAmount}
          paymentForm={paymentForm}
          onPaymentFormChange={(updates) => setPaymentForm((prev) => ({ ...prev, ...updates }))}
          minDate={selectedPurchase?.date ? splitIsoDate(selectedPurchase.date) : ''}
        />

        {/* Payment History Dialog */}
        <PaymentHistoryDialog
          open={paymentHistoryDialogOpen}
          onClose={() => setPaymentHistoryDialogOpen(false)}
          title="Payment History"
          subject={selectedPurchase}
          totalField="totalAmount"
          onOpenPaymentMenu={handleOpenPaymentMenu}
        />

        {/* Payment Action Menu + Edit Sub-Dialog */}
        <PaymentActionMenu
          menuAnchor={paymentMenuAnchor}
          onCloseMenu={handleClosePaymentMenu}
          isEditDisabled={
            selectedPurchase
              ? !selectedPurchase.payments?.length ||
                !selectedPayment ||
                selectedPurchase.payments[selectedPurchase.payments.length - 1]?.id !==
                  selectedPayment.id
              : !selectedExpense?.payments?.length ||
                !selectedPayment ||
                selectedExpense.payments[selectedExpense.payments.length - 1]?.id !==
                  selectedPayment.id
          }
          isDeleteDisabled={
            selectedPurchase
              ? !selectedPurchase.payments?.length ||
                !selectedPayment ||
                selectedPurchase.payments[selectedPurchase.payments.length - 1]?.id !==
                  selectedPayment.id
              : !selectedExpense?.payments?.length ||
                !selectedPayment ||
                selectedExpense.payments[selectedExpense.payments.length - 1]?.id !==
                  selectedPayment.id
          }
          onOpenEditPayment={handleOpenEditPayment}
          onDeletePayment={() => handleDeletePaymentAction(selectedPayment.id)}
          editDialogOpen={paymentEditDialogOpen}
          onCloseEditDialog={() => setPaymentEditDialogOpen(false)}
          onEditSubmit={handleEditPaymentSubmission}
          editPaymentForm={editPaymentForm}
          onEditFormChange={(updates) => setEditPaymentForm((prev) => ({ ...prev, ...updates }))}
          minDate={selectedPurchase?.date ? splitIsoDate(selectedPurchase.date) : ''}
        />

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
            <Button onClick={() => setDeleteConfig({ ...deleteConfig, open: false })}>
              Cancel
            </Button>
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
        <RecordPaymentDialog
          open={expensePaymentDialogOpen}
          onClose={() => setExpensePaymentDialogOpen(false)}
          onSubmit={handleCreateExpensePayment}
          title="Record Expense Payment"
          totalLabel="Total Expense"
          totalValue={selectedExpense?.amount}
          dueAmount={selectedExpense?.dueAmount}
          paymentForm={paymentForm}
          onPaymentFormChange={(updates) => setPaymentForm((prev) => ({ ...prev, ...updates }))}
        />

        {/* Expense Payment History Dialog */}
        <PaymentHistoryDialog
          open={expensePaymentHistoryDialogOpen}
          onClose={() => setExpensePaymentHistoryDialogOpen(false)}
          title="Expense Payment History"
          subject={selectedExpense}
          totalField="amount"
          onOpenPaymentMenu={(e, payment) => {
            setSelectedPurchase(null);
            handleOpenPaymentMenu(e, payment);
          }}
        />
      </Box>
    </Box>
  );
};

export default ExpenseManagement;
