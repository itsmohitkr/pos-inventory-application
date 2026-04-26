import { useState, useEffect, useCallback, useMemo } from 'react';
import posService from '@/shared/api/posService';
import { getResponseArray } from '@/shared/utils/responseGuards';
import {
  getLocalTodayString,
  splitIsoDate,
  getExpenseDateRange,
  filterExpenses,
  filterPurchases,
  calculateExpenseTotals,
} from '@/domains/expenses/components/expenseManagementUtils';

export const EXPENSE_CATEGORIES = ['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc'];

export default function useExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState(null);

  // Filtering state
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [customDates, setCustomDates] = useState({ start: getLocalTodayString(), end: getLocalTodayString() });
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('All');
  const [purchaseVendorFilter, setPurchaseVendorFilter] = useState('All');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [expenseSearchFilter, setExpenseSearchFilter] = useState('');
  const [purchaseSearchFilter, setPurchaseSearchFilter] = useState('');

  // Dialog open state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentHistoryDialogOpen, setPaymentHistoryDialogOpen] = useState(false);
  const [expensePaymentDialogOpen, setExpensePaymentDialogOpen] = useState(false);
  const [expensePaymentHistoryDialogOpen, setExpensePaymentHistoryDialogOpen] = useState(false);
  const [paymentEditDialogOpen, setPaymentEditDialogOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [paymentMenuAnchor, setPaymentMenuAnchor] = useState(null);

  // Selected item state
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Form state
  const [expenseForm, setExpenseForm] = useState({ id: null, amount: '', category: '', description: '', date: getLocalTodayString(), paidAmount: '', paymentMethod: 'Cash' });
  const [purchaseForm, setPurchaseForm] = useState({ id: null, vendor: '', totalAmount: '', date: getLocalTodayString(), note: '', paidAmount: '', paymentMethod: 'Cash', items: [] });
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'Cash', date: getLocalTodayString(), note: '' });
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', paymentMethod: 'Cash', date: getLocalTodayString(), note: '' });

  const fetchData = useCallback(async (callback) => {
    setError(null);
    try {
      const range = getExpenseDateRange(dateFilter, customDates);
      const params = {};
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;

      const [expensesData, purchasesData] = await Promise.all([
        posService.fetchExpenses(params),
        posService.fetchPurchases(params),
      ]);
      const sortedExp = getResponseArray(expensesData).sort((a, b) => a.date === b.date ? b.id - a.id : new Date(b.date) - new Date(a.date));
      const sortedPur = getResponseArray(purchasesData).sort((a, b) => a.date === b.date ? b.id - a.id : new Date(b.date) - new Date(a.date));
      setExpenses(sortedExp);
      setPurchases(sortedPur);
      if (callback) callback(sortedPur, sortedExp);
    } catch {
      setError('Failed to fetch data');
    }
  }, [dateFilter, customDates]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (dateFilter !== 'custom') fetchData();
  }, [dateFilter, fetchData]);

  // --- Expense handlers ---
  const handleOpenExpenseDialog = () => {
    setExpenseForm({ id: null, amount: '', category: '', description: '', date: getLocalTodayString(), paidAmount: '', paymentMethod: 'Cash' });
    setExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense) => {
    setExpenseForm({ id: expense.id, amount: expense.amount, category: expense.category, description: expense.description || '', date: new Date(expense.date).toISOString().split('T')[0], paymentMethod: expense.paymentMethod || 'Cash' });
    setExpenseDialogOpen(true);
  };

  const handleCreateExpense = async (e) => {
    if (e) e.preventDefault();
    try {
      if (expenseForm.id) {
        await posService.updateExpense(expenseForm.id, expenseForm);
      } else {
        await posService.createExpense({ ...expenseForm, amount: parseFloat(expenseForm.amount) || 0, paidAmount: parseFloat(expenseForm.paidAmount) || 0 });
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

  const handleOpenExpensePaymentDialog = (expense) => {
    setSelectedExpense(expense);
    setPaymentForm({ amount: expense.dueAmount || 0, paymentMethod: expense.paymentMethod || 'Cash', date: getLocalTodayString(), note: '' });
    setExpensePaymentDialogOpen(true);
  };

  const handleOpenExpensePaymentHistoryDialog = (expense) => {
    setSelectedExpense(expense);
    setExpensePaymentHistoryDialogOpen(true);
  };

  const handleCreateExpensePayment = async (e) => {
    if (e) e.preventDefault();
    try {
      await posService.createExpensePayment(selectedExpense.id, { amount: parseFloat(paymentForm.amount), paymentMethod: paymentForm.paymentMethod, date: paymentForm.date, note: paymentForm.note });
      setExpensePaymentDialogOpen(false);
      fetchData();
    } catch {
      setError('Failed to save expense payment.');
    }
  };

  // --- Purchase handlers ---
  const handleOpenPurchaseDialog = () => {
    setPurchaseForm({ id: null, vendor: '', totalAmount: '', date: getLocalTodayString(), note: '', paidAmount: '', paymentMethod: 'Cash', items: [] });
    setPurchaseDialogOpen(true);
  };

  const handleEditPurchase = (purchase) => {
    setPurchaseForm({ id: purchase.id, vendor: purchase.vendor || '', totalAmount: purchase.totalAmount, note: purchase.note || '', date: new Date(purchase.date).toISOString().split('T')[0], paidAmount: purchase.totalPaid || 0, paymentMethod: purchase.paymentMethod || 'Cash', items: purchase.items || [] });
    setPurchaseDialogOpen(true);
  };

  const handleCreatePurchase = async (e) => {
    if (e) e.preventDefault();
    try {
      const submissionData = { ...purchaseForm, totalAmount: parseFloat(purchaseForm.totalAmount) || 0, paidAmount: purchaseForm.id ? undefined : parseFloat(purchaseForm.paidAmount) || 0, items: (purchaseForm.items || []).filter((item) => item.productId && item.quantity) };
      if (purchaseForm.id) {
        const { paidAmount: _p, ...updateData } = submissionData;
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
      message: 'Are you sure you want to delete this purchase? This action cannot be undone and will affect inventory records.',
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
    setPaymentForm({ amount: purchase.dueAmount || 0, paymentMethod: purchase.paymentMethod || 'Cash', date: getLocalTodayString(), note: '' });
    setPaymentDialogOpen(true);
  };

  const handleOpenPaymentHistoryDialog = (purchase) => {
    setSelectedPurchase(purchase);
    setPaymentHistoryDialogOpen(true);
  };

  const handleCreatePayment = async (e) => {
    if (e) e.preventDefault();
    try {
      await posService.createPurchasePayment(selectedPurchase.id, { amount: parseFloat(paymentForm.amount), paymentMethod: paymentForm.paymentMethod, date: paymentForm.date, note: paymentForm.note });
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

  // --- Payment menu / edit / delete ---
  const handleOpenPaymentMenu = (event, payment) => {
    setPaymentMenuAnchor(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleClosePaymentMenu = () => setPaymentMenuAnchor(null);

  const handleOpenEditPayment = () => {
    setEditPaymentForm({ amount: selectedPayment.amount, paymentMethod: selectedPayment.paymentMethod || 'Cash', date: selectedPayment.date ? splitIsoDate(selectedPayment.date) : getLocalTodayString(), note: selectedPayment.note || '' });
    setPaymentEditDialogOpen(true);
    handleClosePaymentMenu();
  };

  const handleEditPaymentSubmission = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = { amount: parseFloat(editPaymentForm.amount), paymentMethod: editPaymentForm.paymentMethod, date: editPaymentForm.date, note: editPaymentForm.note };
      if (selectedPurchase) {
        await posService.updatePurchasePayment(selectedPayment.id, payload);
      } else {
        await posService.updateExpensePayment(selectedPayment.id, payload);
      }
      setPaymentEditDialogOpen(false);
      fetchData((updatedPurchases, updatedExpenses) => {
        if (selectedPurchase) {
          const r = updatedPurchases.find((p) => p.id === selectedPurchase.id);
          if (r) setSelectedPurchase(r);
        } else if (selectedExpense) {
          const r = updatedExpenses.find((e) => e.id === selectedExpense.id);
          if (r) setSelectedExpense(r);
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
              const r = updatedPurchases.find((p) => p.id === selectedPurchase.id);
              if (r) setSelectedPurchase(r);
            } else if (selectedExpense) {
              const r = updatedExpenses.find((e) => e.id === selectedExpense.id);
              if (r) setSelectedExpense(r);
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

  // --- Derived state ---
  const vendorOptions = useMemo(() => Array.from(new Set(purchases.map((p) => p.vendor).filter(Boolean))), [purchases]);
  const filteredExpenses = useMemo(() => filterExpenses(expenses, expenseCategoryFilter, expenseSearchFilter), [expenses, expenseCategoryFilter, expenseSearchFilter]);
  const filteredPurchases = useMemo(() => filterPurchases(purchases, purchaseStatusFilter, purchaseVendorFilter, purchaseSearchFilter), [purchases, purchaseStatusFilter, purchaseVendorFilter, purchaseSearchFilter]);
  const { totalExpensesAmount, totalExpensesDue, totalPurchasesAmount, totalPurchasesDue } = useMemo(() => calculateExpenseTotals(filteredExpenses, filteredPurchases), [filteredExpenses, filteredPurchases]);

  return {
    // data
    filteredExpenses, filteredPurchases, vendorOptions,
    totalExpensesAmount, totalExpensesDue, totalPurchasesAmount, totalPurchasesDue,
    error, setError,
    // filter state
    dateFilter, setDateFilter, customDates, setCustomDates,
    purchaseStatusFilter, setPurchaseStatusFilter,
    purchaseVendorFilter, setPurchaseVendorFilter,
    expenseCategoryFilter, setExpenseCategoryFilter,
    expenseSearchFilter, setExpenseSearchFilter,
    purchaseSearchFilter, setPurchaseSearchFilter,
    // dialog open flags
    expenseDialogOpen, setExpenseDialogOpen,
    purchaseDialogOpen, setPurchaseDialogOpen,
    paymentDialogOpen, setPaymentDialogOpen,
    paymentHistoryDialogOpen, setPaymentHistoryDialogOpen,
    expensePaymentDialogOpen, setExpensePaymentDialogOpen,
    expensePaymentHistoryDialogOpen, setExpensePaymentHistoryDialogOpen,
    paymentEditDialogOpen, setPaymentEditDialogOpen,
    deleteConfig, setDeleteConfig,
    paymentMenuAnchor,
    // selected items
    selectedPurchase, setSelectedPurchase,
    selectedExpense,
    selectedPayment,
    // forms
    expenseForm, setExpenseForm,
    purchaseForm, setPurchaseForm,
    paymentForm, setPaymentForm,
    editPaymentForm, setEditPaymentForm,
    // handlers
    fetchData,
    handleOpenExpenseDialog, handleEditExpense, handleCreateExpense, handleDeleteExpense,
    handleOpenExpensePaymentDialog, handleOpenExpensePaymentHistoryDialog, handleCreateExpensePayment,
    handleOpenPurchaseDialog, handleEditPurchase, handleCreatePurchase, handleDeletePurchase,
    handleOpenPaymentDialog, handleOpenPaymentHistoryDialog, handleCreatePayment,
    handleOpenPaymentMenu, handleClosePaymentMenu, handleOpenEditPayment,
    handleEditPaymentSubmission, handleDeletePaymentAction,
    splitIsoDate,
  };
}
