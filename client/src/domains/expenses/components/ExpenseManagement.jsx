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
      {/* Premium Header */}
      <Paper
        elevation={0}
        sx={{
          m: 1.5,
          px: 2.5,
          py: 1.75,
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>
            Expenses & Purchases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage operational costs and inventory procurement records.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ fontWeight: 600 }}>Period</InputLabel>
            <Select
              value={em.dateFilter}
              label="Period"
              onChange={(e) => em.setDateFilter(e.target.value)}
              sx={{
                borderRadius: '8px',
                bgcolor: '#f8fafc',
                fontWeight: 600,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
              }}
            >
              {['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'].map((v) => (
                <MenuItem key={v} value={v} sx={{ fontWeight: 500 }}>
                  {v.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                </MenuItem>
              ))}
              <MenuItem value="custom" sx={{ fontWeight: 600 }}>Custom Range</MenuItem>
            </Select>
          </FormControl>
          {em.dateFilter === 'custom' && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="date"
                value={em.customDates.start}
                onChange={(e) => em.setCustomDates({ ...em.customDates, start: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f8fafc' } }}
              />
              <TextField
                size="small"
                type="date"
                value={em.customDates.end}
                onChange={(e) => em.setCustomDates({ ...em.customDates, end: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f8fafc' } }}
              />
              <Button
                variant="contained"
                onClick={em.fetchData}
                sx={{ borderRadius: '8px', bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700 }}
              >
                Apply
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Financial Summary Stat Cards */}
      <Box sx={{ px: 1.5, mb: 1.5, display: 'flex', gap: 1.5 }}>
        {[
          {
            label: 'TOTAL EXPENDITURE',
            value: em.totalExpensesAmount + em.totalPurchasesAmount,
            subtitle: 'Expenses + Purchases',
            accentColor: '#3b82f6'
          },
          {
            label: 'TOTAL OUTSTANDING',
            value: em.totalExpensesDue + em.totalPurchasesDue,
            subtitle: 'Unpaid Dues / Liabilities',
            accentColor: '#ef4444'
          },
          {
            label: 'OPERATING COST',
            value: em.totalExpensesAmount,
            subtitle: 'Excl. Inventory Purchases',
            accentColor: '#10b981'
          }
        ].map((card) => (
          <Box
            key={card.label}
            sx={{
              flex: 1,
              p: 2,
              borderRadius: '12px',
              bgcolor: `${card.accentColor}0A`, // 4% opacity
              border: `1px solid ${card.accentColor}33`, // 20% opacity
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: `${card.accentColor}1A`, // 10% opacity
                borderColor: `${card.accentColor}66`, // 40% opacity
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${card.accentColor}1A`,
              }
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 800, 
                color: card.accentColor, 
                display: 'block', 
                mb: 0.5,
                letterSpacing: '0.5px'
              }}
            >
              {card.label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
              ₹{card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {card.subtitle}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflow: 'hidden', px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            bgcolor: '#ffffff',
          }}
        >
          <Box sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                px: 2,
                minHeight: 48,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  minHeight: 48,
                  color: '#64748b',
                  '&.Mui-selected': { color: '#0f172a' },
                },
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#0f172a' },
              }}
            >
              <Tab icon={<ReceiptIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Operating Expenses" />
              <Tab icon={<ShippingIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Inventory Purchases" />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
            {em.error && (
              <Alert
                severity="error"
                sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}
                onClose={() => em.setError(null)}
              >
                {em.error}
              </Alert>
            )}
            
            {activeTab === 0 && (
              <ExpenseListTab
                filteredExpenses={em.filteredExpenses}
                expenseCategoryFilter={em.expenseCategoryFilter}
                setExpenseCategoryFilter={em.setExpenseCategoryFilter}
                expenseSearchFilter={em.expenseSearchFilter}
                setExpenseSearchFilter={em.setExpenseSearchFilter}
                totalExpensesAmount={em.totalExpensesAmount}
                totalExpensesDue={em.totalExpensesDue}
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
                purchaseStatusFilter={em.purchaseStatusFilter}
                setPurchaseStatusFilter={em.setPurchaseStatusFilter}
                purchaseVendorFilter={em.purchaseVendorFilter}
                setPurchaseVendorFilter={em.setPurchaseVendorFilter}
                purchaseSearchFilter={em.purchaseSearchFilter}
                setPurchaseSearchFilter={em.setPurchaseSearchFilter}
                totalPurchasesAmount={em.totalPurchasesAmount}
                totalPurchasesDue={em.totalPurchasesDue}
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
        <ExpenseFormDialog
          open={em.expenseDialogOpen}
          onClose={() => em.setExpenseDialogOpen(false)}
          onSubmit={em.handleCreateExpense}
          expenseForm={em.expenseForm}
          onFormChange={(u) => em.setExpenseForm((prev) => ({ ...prev, ...u }))}
          categories={['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc']}
        />
        <PurchaseFormDialog
          open={em.purchaseDialogOpen}
          onClose={() => em.setPurchaseDialogOpen(false)}
          onSubmit={em.handleCreatePurchase}
          purchaseForm={em.purchaseForm}
          onFormChange={(u) => em.setPurchaseForm((prev) => ({ ...prev, ...u }))}
          vendorOptions={em.vendorOptions}
        />
        <RecordPaymentDialog
          open={em.paymentDialogOpen}
          onClose={() => em.setPaymentDialogOpen(false)}
          onSubmit={em.handleCreatePayment}
          title="Make Payment"
          totalLabel="Total Amount"
          totalValue={em.selectedPurchase?.totalAmount}
          dueAmount={em.selectedPurchase?.dueAmount}
          paymentForm={em.paymentForm}
          onPaymentFormChange={(u) => em.setPaymentForm((prev) => ({ ...prev, ...u }))}
          minDate={em.selectedPurchase?.date ? splitIsoDate(em.selectedPurchase.date) : ''}
        />
        <PaymentHistoryDialog
          open={em.paymentHistoryDialogOpen}
          onClose={() => em.setPaymentHistoryDialogOpen(false)}
          title="Payment History"
          subject={em.selectedPurchase}
          totalField="totalAmount"
          onOpenPaymentMenu={em.handleOpenPaymentMenu}
        />
        <PaymentActionMenu
          menuAnchor={em.paymentMenuAnchor}
          onCloseMenu={em.handleClosePaymentMenu}
          isEditDisabled={
            em.selectedPurchase
              ? !em.selectedPurchase.payments?.length || !em.selectedPayment || em.selectedPurchase.payments[em.selectedPurchase.payments.length - 1]?.id !== em.selectedPayment.id
              : !em.selectedExpense?.payments?.length || !em.selectedPayment || em.selectedExpense?.payments[em.selectedExpense.payments.length - 1]?.id !== em.selectedPayment.id
          }
          isDeleteDisabled={
            em.selectedPurchase
              ? !em.selectedPurchase.payments?.length || !em.selectedPayment || em.selectedPurchase.payments[em.selectedPurchase.payments.length - 1]?.id !== em.selectedPayment.id
              : !em.selectedExpense?.payments?.length || !em.selectedPayment || em.selectedExpense?.payments[em.selectedExpense.payments.length - 1]?.id !== em.selectedPayment.id
          }
          onOpenEditPayment={em.handleOpenEditPayment}
          onDeletePayment={() => em.handleDeletePaymentAction(em.selectedPayment.id)}
          editDialogOpen={em.paymentEditDialogOpen}
          onCloseEditDialog={() => em.setPaymentEditDialogOpen(false)}
          onEditSubmit={em.handleEditPaymentSubmission}
          editPaymentForm={em.editPaymentForm}
          onEditFormChange={(u) => em.setEditPaymentForm((prev) => ({ ...prev, ...u }))}
          minDate={em.selectedPurchase?.date ? splitIsoDate(em.selectedPurchase.date) : ''}
        />
        <RecordPaymentDialog
          open={em.expensePaymentDialogOpen}
          onClose={() => em.setExpensePaymentDialogOpen(false)}
          onSubmit={em.handleCreateExpensePayment}
          title="Record Expense Payment"
          totalLabel="Total Expense"
          totalValue={em.selectedExpense?.amount}
          dueAmount={em.selectedExpense?.dueAmount}
          paymentForm={em.paymentForm}
          onPaymentFormChange={(u) => em.setPaymentForm((prev) => ({ ...prev, ...u }))}
        />
        <PaymentHistoryDialog
          open={em.expensePaymentHistoryDialogOpen}
          onClose={() => em.setExpensePaymentHistoryDialogOpen(false)}
          title="Expense Payment History"
          subject={em.selectedExpense}
          totalField="amount"
          onOpenPaymentMenu={(e, payment) => {
            em.setSelectedPurchase(null);
            em.handleOpenPaymentMenu(e, payment);
          }}
        />

        {/* Delete confirmation */}
        <Dialog
          open={em.deleteConfig.open}
          onClose={() => em.setDeleteConfig({ ...em.deleteConfig, open: false })}
          PaperProps={{ sx: { borderRadius: '12px' } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>{em.deleteConfig.title}</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontWeight: 500, color: '#475569' }}>{em.deleteConfig.message}</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => em.setDeleteConfig({ ...em.deleteConfig, open: false })}
              sx={{ fontWeight: 700, color: '#64748b', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => em.deleteConfig.onConfirm?.()}
              color="error"
              variant="contained"
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '8px' }}
            >
              Confirm Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ExpenseManagement;
