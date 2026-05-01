import React from 'react';
import {
  Box, Typography, Stack, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Payment as PaymentIcon } from '@mui/icons-material';
import { EXPENSE_CATEGORIES } from '@/domains/expenses/components/useExpenseManagement';

const ExpenseListTab = ({
  filteredExpenses,
  expenseCategoryFilter, setExpenseCategoryFilter,
  expenseSearchFilter, setExpenseSearchFilter,
  totalExpensesAmount, totalExpensesDue,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenPaymentDialog,
  onOpenPaymentHistoryDialog,
}) => (
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
          <Select value={expenseCategoryFilter} label="Category" onChange={(e) => setExpenseCategoryFilter(e.target.value)}>
            <MenuItem value="All">All Categories</MenuItem>
            {EXPENSE_CATEGORIES.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddExpense}>
          Add Expense
        </Button>
      </Stack>
    </Stack>

    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {['DATE', 'CATEGORY', 'DESCRIPTION', 'METHOD', 'AMOUNT', 'DUE', 'STATUS', 'ACTIONS'].map((h, i) => (
              <TableCell key={h} align={i >= 4 && i <= 5 ? 'right' : i >= 6 ? 'center' : 'left'} sx={{ fontWeight: 800 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredExpenses.map((row) => (
            <TableRow key={row.id} onDoubleClick={() => onOpenPaymentHistoryDialog(row)} sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}>
              <TableCell>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.paymentMethod || 'Cash'}</TableCell>
              <TableCell align="right">₹{row.amount.toLocaleString()}</TableCell>
              <TableCell align="right">
                {(row.dueAmount || 0) > 0
                  ? <Typography fontWeight="bold" color="error.main">₹{row.dueAmount.toLocaleString()}</Typography>
                  : <Typography color="text.secondary">-</Typography>}
              </TableCell>
              <TableCell align="center">
                <Chip label={row.paymentStatus || 'Paid'} size="small" sx={{ fontWeight: 'bold', minWidth: 70 }}
                  color={row.paymentStatus === 'Paid' ? 'success' : row.paymentStatus === 'Due' ? 'warning' : 'error'} />
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {(row.dueAmount || 0) > 0 && (
                    <IconButton size="small" color="success" onClick={() => onOpenPaymentDialog(row)} aria-label="Pay">
                      <PaymentIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton size="small" color="primary" onClick={() => onEditExpense(row)} aria-label="Edit">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onDeleteExpense(row.id)} aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {filteredExpenses.length === 0 && (
            <TableRow><TableCell colSpan={8} align="center">No expenses match criteria</TableCell></TableRow>
          )}
          {filteredExpenses.length > 0 && (
            <TableRow sx={{ bgcolor: '#f3eee6', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <TableCell colSpan={4} sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight={700} textAlign="right" color="text.secondary">Total Current Period</Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" fontWeight={700} color="text.primary">₹{totalExpensesAmount.toLocaleString()}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" fontWeight={700} color="error.main">₹{totalExpensesDue.toLocaleString()}</Typography>
              </TableCell>
              <TableCell colSpan={2} sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default ExpenseListTab;
