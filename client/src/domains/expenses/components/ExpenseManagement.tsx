import { useState } from 'react';
import type {
  ExpenseFormState,
  PaymentFormState,
  PurchaseFormState,
} from '@/domains/expenses/components/useExpenseManagement';
import type { Expense, Purchase } from '@/domains/expenses/components/expenseTypes';
import {
  Box, Typography, Paper, Button, TextField, Stack,
  FormControl, InputLabel, Select, MenuItem, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ExpenseSidebar, { type ExpenseNavTab } from '@/domains/expenses/components/ExpenseSidebar';
import PurchasePaymentHistoryCard from '@/domains/expenses/components/PurchasePaymentHistoryCard';
import ExpenseFormDialog from '@/domains/expenses/components/ExpenseFormDialog';
import PurchaseFormDialog from '@/domains/expenses/components/PurchaseFormDialog';
import RecordPaymentDialog from '@/domains/expenses/components/RecordPaymentDialog';
import PaymentActionMenu from '@/domains/expenses/components/PaymentActionMenu';
import ExpenseListTab from '@/domains/expenses/components/ExpenseListTab';
import PurchaseListTab from '@/domains/expenses/components/PurchaseListTab';
import useExpenseManagement from '@/domains/expenses/components/useExpenseManagement';
import { splitIsoDate } from '@/domains/expenses/components/expenseManagementUtils';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';

const ExpenseManagement = () => {
  const [activeTab, setActiveTab] = useState<ExpenseNavTab>('operating_expenses');
  const em = useExpenseManagement();

  const {
    width: rightPanelWidth,
    startResizing,
    isResizing,
  } = useResizablePanel({
    storageKey: 'expensesRightPanelWidth',
    defaultWidth: 400,
    min: 300,
    maxRatio: 0.5,
    anchor: 'right',
  });

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
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>
            Expenses & Purchases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage operational costs and inventory procurement records.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl
            size="small"
            sx={{
              minWidth: 160,
              '& .MuiOutlinedInput-root': {
                height: '36px',
                borderRadius: '6px',
                bgcolor: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#1f2937',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#0b1d39' },
              },
            }}
          >
            <InputLabel sx={{ fontSize: '0.85rem', top: -1, fontWeight: 500 }}>Period</InputLabel>
            <Select
              value={em.dateFilter}
              label="Period"
              onChange={(e) => em.setDateFilter(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  py: 0,
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              {['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'].map((v) => (
                <MenuItem key={v} value={v} sx={{ fontWeight: 400, fontSize: '0.85rem' }}>
                  {v.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                </MenuItem>
              ))}
              <MenuItem value="custom" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>Custom Range</MenuItem>
            </Select>
          </FormControl>
          {em.dateFilter === 'custom' && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="date"
                label="Start"
                InputLabelProps={{ shrink: true }}
                value={em.customDates.start}
                onChange={(e) => em.setCustomDates({ ...em.customDates, start: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '36px',
                    borderRadius: '6px',
                    bgcolor: '#f8fafc',
                    fontSize: '0.85rem',
                    '& fieldset': { borderColor: '#e2e8f0' },
                  },
                }}
              />
              <TextField
                size="small"
                type="date"
                label="End"
                InputLabelProps={{ shrink: true }}
                value={em.customDates.end}
                onChange={(e) => em.setCustomDates({ ...em.customDates, end: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '36px',
                    borderRadius: '6px',
                    bgcolor: '#f8fafc',
                    fontSize: '0.85rem',
                    '& fieldset': { borderColor: '#e2e8f0' },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => em.fetchData()}
                sx={{
                  height: '36px',
                  borderRadius: '6px',
                  bgcolor: '#0b1d39',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  px: 1.5,
                  '&:hover': { bgcolor: '#1e293b' },
                }}
              >
                Apply
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Financial Summary Stat Cards */}
      <Box sx={{ px: 1.5, mb: 1.5, display: 'flex', gap: 1.5, flexShrink: 0 }}>
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
              p: 1.75,
              borderRadius: '10px',
              bgcolor: `${card.accentColor}0A`,
              border: `1px solid ${card.accentColor}33`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: `${card.accentColor}1A`,
                borderColor: `${card.accentColor}66`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${card.accentColor}1A`,
              }
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                color: card.accentColor, 
                display: 'block', 
                mb: 0.25,
                letterSpacing: '0.3px',
                fontSize: '0.72rem',
              }}
            >
              {card.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2, fontSize: '1.15rem' }}>
              ₹{card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 400, fontSize: '0.75rem' }}>
              {card.subtitle}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Content Area: Sidebar on Left, Table in Center, Resizer Slider, Payment History Card on Right */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          px: 1.5,
          pb: 1.5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          minHeight: 0,
        }}
      >
        {/* Left Sidebar Navigation */}
        <ExpenseSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            em.setSelectedPurchase(null);
            em.setSelectedExpense(null);
          }}
        />

        {/* Center: Main Table Container */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            bgcolor: '#ffffff',
            minWidth: 0,
          }}
        >
          {em.error && (
            <Alert
              severity="error"
              sx={{ m: 1.5, mb: 0, borderRadius: '6px', fontWeight: 600 }}
              onClose={() => em.setError(null)}
            >
              {em.error}
            </Alert>
          )}

          {activeTab === 'operating_expenses' && (
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
              selectedExpense={em.selectedExpense}
              onSelectExpense={em.setSelectedExpense}
            />
          )}

          {activeTab === 'inventory_purchases' && (
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
              selectedPurchase={em.selectedPurchase}
              onSelectPurchase={em.setSelectedPurchase}
            />
          )}
        </Paper>

        {/* Resizer Slider Handle between Table Card & Payment History Card */}
        {((activeTab === 'inventory_purchases' && em.selectedPurchase) ||
          (activeTab === 'operating_expenses' && em.selectedExpense)) && (
          <Box
            onMouseDown={startResizing}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              width: '12px',
              mx: -1.5,
              cursor: 'col-resize',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              flexShrink: 0,
              '&:hover .handle': {
                bgcolor: '#0b1d39',
                width: '4px',
              },
            }}
          >
            <Box
              className="handle"
              sx={{
                width: '2px',
                height: '60px',
                bgcolor: isResizing ? '#0b1d39' : 'divider',
                borderRadius: '4px',
                transition: 'all 0.2s',
                ...(isResizing && { width: '4px' }),
              }}
            />
          </Box>
        )}

        {/* Right Side: Payment History Card for Selected Purchase */}
        {activeTab === 'inventory_purchases' && em.selectedPurchase && (
          <PurchasePaymentHistoryCard
            purchase={em.selectedPurchase}
            onClose={() => em.setSelectedPurchase(null)}
            onOpenPaymentDialog={(item) => em.handleOpenPaymentDialog(item as Purchase)}
            onOpenPaymentMenu={em.handleOpenPaymentMenu}
            width={rightPanelWidth}
          />
        )}

        {/* Right Side: Payment History Card for Selected Expense */}
        {activeTab === 'operating_expenses' && em.selectedExpense && (
          <PurchasePaymentHistoryCard
            expense={em.selectedExpense}
            onClose={() => em.setSelectedExpense(null)}
            onOpenPaymentDialog={(item) => em.handleOpenExpensePaymentDialog(item as Expense)}
            onOpenPaymentMenu={em.handleOpenPaymentMenu}
            width={rightPanelWidth}
          />
        )}
      </Box>

        {/* Dialogs */}
        <ExpenseFormDialog
          open={em.expenseDialogOpen}
          onClose={() => em.setExpenseDialogOpen(false)}
          onSubmit={em.handleCreateExpense}
          expenseForm={em.expenseForm}
          onFormChange={(u: Partial<ExpenseFormState>) =>
            em.setExpenseForm((prev) => ({ ...prev, ...u }))
          }
          categories={['Electricity', 'Rent', 'Wages', 'WiFi', 'Maintenance', 'Misc']}
        />
        <PurchaseFormDialog
          open={em.purchaseDialogOpen}
          onClose={() => em.setPurchaseDialogOpen(false)}
          onSubmit={em.handleCreatePurchase}
          purchaseForm={em.purchaseForm}
          onFormChange={(u: Partial<PurchaseFormState>) =>
            em.setPurchaseForm((prev) => ({ ...prev, ...u }))
          }
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
          minDate={splitIsoDate(em.selectedPurchase?.date)}
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
          onDeletePayment={() => em.selectedPayment && em.handleDeletePaymentAction(em.selectedPayment.id)}
          editDialogOpen={em.paymentEditDialogOpen}
          onCloseEditDialog={() => em.setPaymentEditDialogOpen(false)}
          onEditSubmit={em.handleEditPaymentSubmission}
          editPaymentForm={em.editPaymentForm}
          onEditFormChange={(u: Partial<PaymentFormState>) =>
            em.setEditPaymentForm((prev) => ({ ...prev, ...u }))
          }
          minDate={splitIsoDate(em.selectedPurchase ? em.selectedPurchase.date : em.selectedExpense?.date)}
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
  );
};

export default ExpenseManagement;
