import React from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Button, TextField, Stack,
  FormControl, InputLabel, Select, MenuItem, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Receipt as ReceiptIcon, LocalShipping as ShippingIcon } from '@mui/icons-material';
import ExpenseFormDialog from '@/domains/expenses/components/ExpenseFormDialog';
import PurchaseFormDialog from '@/domains/expenses/components/PurchaseFormDialog';
import RecordPaymentDialog from '@/domains/expenses/components/RecordPaymentDialog';
import PaymentHistoryDialog from '@/domains/expenses/components/PaymentHistoryDialog';
import PaymentActionMenu from '@/domains/expenses/components/PaymentActionMenu';
import ExpenseListTab from '@/domains/expenses/components/ExpenseListTab';
import PurchaseListTab from '@/domains/expenses/components/PurchaseListTab';
import useExpenseManagement from '@/domains/expenses/components/useExpenseManagement';
import { splitIsoDate } from '@/domains/expenses/components/expenseManagementUtils';

const ExpenseManagement = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const em = useExpenseManagement();

  return (
    <Box sx={{ bgcolor: 'background.default', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ m: 2.5, px: 3, py: 2.25, background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)', borderBottom: '1px solid rgba(16, 24, 40, 0.08)', flexShrink: 0 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>Financial Tracking</Typography>
            <Typography variant="body2" color="text.secondary">Monitor operating expenses and inventory purchases.</Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Frame</InputLabel>
              <Select value={em.dateFilter} label="Time Frame" onChange={(e) => em.setDateFilter(e.target.value)}>
                {['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'].map((v) => (
                  <MenuItem key={v} value={v}>{v.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</MenuItem>
                ))}
                <MenuItem value="custom">Custom Date</MenuItem>
              </Select>
            </FormControl>
            {em.dateFilter === 'custom' && (
              <>
                <TextField size="small" type="date" label="Start" value={em.customDates.start} onChange={(e) => em.setCustomDates({ ...em.customDates, start: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="date" label="End" value={em.customDates.end} onChange={(e) => em.setCustomDates({ ...em.customDates, end: e.target.value })} InputLabelProps={{ shrink: true }} />
                <Button variant="outlined" onClick={em.fetchData} sx={{ height: 40 }}>Apply</Button>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pb: 2.5 }}>
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<ReceiptIcon />} iconPosition="start" label="Expenses" />
            <Tab icon={<ShippingIcon />} iconPosition="start" label="Inventory Purchases" />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {em.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => em.setError(null)}>{em.error}</Alert>}
            {activeTab === 0 && (
              <ExpenseListTab
                filteredExpenses={em.filteredExpenses}
                expenseCategoryFilter={em.expenseCategoryFilter} setExpenseCategoryFilter={em.setExpenseCategoryFilter}
                expenseSearchFilter={em.expenseSearchFilter} setExpenseSearchFilter={em.setExpenseSearchFilter}
                totalExpensesAmount={em.totalExpensesAmount} totalExpensesDue={em.totalExpensesDue}
                onAddExpense={em.handleOpenExpenseDialog}
                onEditExpense={em.handleEditExpense}
                onDeleteExpense={em.handleDeleteExpense}
                onOpenPaymentDialog={em.handleOpenExpensePaymentDialog}
                onOpenPaymentHistoryDialog={em.handleOpenExpensePaymentHistoryDialog}
              />
            )}
            {activeTab === 1 && (
              <PurchaseListTab
                filteredPurchases={em.filteredPurchases}
                vendorOptions={em.vendorOptions}
                purchaseStatusFilter={em.purchaseStatusFilter} setPurchaseStatusFilter={em.setPurchaseStatusFilter}
                purchaseVendorFilter={em.purchaseVendorFilter} setPurchaseVendorFilter={em.setPurchaseVendorFilter}
                purchaseSearchFilter={em.purchaseSearchFilter} setPurchaseSearchFilter={em.setPurchaseSearchFilter}
                totalPurchasesAmount={em.totalPurchasesAmount} totalPurchasesDue={em.totalPurchasesDue}
                onAddPurchase={em.handleOpenPurchaseDialog}
                onEditPurchase={em.handleEditPurchase}
                onDeletePurchase={em.handleDeletePurchase}
                onOpenPaymentDialog={em.handleOpenPaymentDialog}
                onOpenPaymentHistoryDialog={em.handleOpenPaymentHistoryDialog}
              />
            )}
          </Box>
        </Paper>

        {/* Dialogs */}
        <ExpenseFormDialog open={em.expenseDialogOpen} onClose={() => em.setExpenseDialogOpen(false)} onSubmit={em.handleCreateExpense} expenseForm={em.expenseForm} onFormChange={(u) => em.setExpenseForm((prev) => ({ ...prev, ...u }))} categories={['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc']} />
        <PurchaseFormDialog open={em.purchaseDialogOpen} onClose={() => em.setPurchaseDialogOpen(false)} onSubmit={em.handleCreatePurchase} purchaseForm={em.purchaseForm} onFormChange={(u) => em.setPurchaseForm((prev) => ({ ...prev, ...u }))} vendorOptions={em.vendorOptions} />
        <RecordPaymentDialog open={em.paymentDialogOpen} onClose={() => em.setPaymentDialogOpen(false)} onSubmit={em.handleCreatePayment} title="Make Payment" totalLabel="Total Amount" totalValue={em.selectedPurchase?.totalAmount} dueAmount={em.selectedPurchase?.dueAmount} paymentForm={em.paymentForm} onPaymentFormChange={(u) => em.setPaymentForm((prev) => ({ ...prev, ...u }))} minDate={em.selectedPurchase?.date ? splitIsoDate(em.selectedPurchase.date) : ''} />
        <PaymentHistoryDialog open={em.paymentHistoryDialogOpen} onClose={() => em.setPaymentHistoryDialogOpen(false)} title="Payment History" subject={em.selectedPurchase} totalField="totalAmount" onOpenPaymentMenu={em.handleOpenPaymentMenu} />
        <PaymentActionMenu menuAnchor={em.paymentMenuAnchor} onCloseMenu={em.handleClosePaymentMenu}
          isEditDisabled={em.selectedPurchase ? (!em.selectedPurchase.payments?.length || !em.selectedPayment || em.selectedPurchase.payments[em.selectedPurchase.payments.length - 1]?.id !== em.selectedPayment.id) : (!em.selectedExpense?.payments?.length || !em.selectedPayment || em.selectedExpense?.payments[em.selectedExpense.payments.length - 1]?.id !== em.selectedPayment.id)}
          isDeleteDisabled={em.selectedPurchase ? (!em.selectedPurchase.payments?.length || !em.selectedPayment || em.selectedPurchase.payments[em.selectedPurchase.payments.length - 1]?.id !== em.selectedPayment.id) : (!em.selectedExpense?.payments?.length || !em.selectedPayment || em.selectedExpense?.payments[em.selectedExpense.payments.length - 1]?.id !== em.selectedPayment.id)}
          onOpenEditPayment={em.handleOpenEditPayment} onDeletePayment={() => em.handleDeletePaymentAction(em.selectedPayment.id)}
          editDialogOpen={em.paymentEditDialogOpen} onCloseEditDialog={() => em.setPaymentEditDialogOpen(false)} onEditSubmit={em.handleEditPaymentSubmission}
          editPaymentForm={em.editPaymentForm} onEditFormChange={(u) => em.setEditPaymentForm((prev) => ({ ...prev, ...u }))}
          minDate={em.selectedPurchase?.date ? splitIsoDate(em.selectedPurchase.date) : ''} />
        <RecordPaymentDialog open={em.expensePaymentDialogOpen} onClose={() => em.setExpensePaymentDialogOpen(false)} onSubmit={em.handleCreateExpensePayment} title="Record Expense Payment" totalLabel="Total Expense" totalValue={em.selectedExpense?.amount} dueAmount={em.selectedExpense?.dueAmount} paymentForm={em.paymentForm} onPaymentFormChange={(u) => em.setPaymentForm((prev) => ({ ...prev, ...u }))} />
        <PaymentHistoryDialog open={em.expensePaymentHistoryDialogOpen} onClose={() => em.setExpensePaymentHistoryDialogOpen(false)} title="Expense Payment History" subject={em.selectedExpense} totalField="amount" onOpenPaymentMenu={(e, payment) => { em.setSelectedPurchase(null); em.handleOpenPaymentMenu(e, payment); }} />

        {/* Delete confirmation */}
        <Dialog open={em.deleteConfig.open} onClose={() => em.setDeleteConfig({ ...em.deleteConfig, open: false })}>
          <DialogTitle>{em.deleteConfig.title}</DialogTitle>
          <DialogContent><Typography>{em.deleteConfig.message}</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => em.setDeleteConfig({ ...em.deleteConfig, open: false })}>Cancel</Button>
            <Button onClick={() => em.deleteConfig.onConfirm?.()} color="error" variant="contained" sx={{ color: '#fff' }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ExpenseManagement;
