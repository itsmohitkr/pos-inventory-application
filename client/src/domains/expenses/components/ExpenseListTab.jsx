import React from 'react';
import {
  Box, Typography, Stack, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, Chip, IconButton, Autocomplete
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
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 3,
        px: 2,
        borderBottom: '1px solid #f1f5f9',
        mb: 2
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Operating Expenses</Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>Track recurring costs, bills, and miscellaneous spends</Typography>
      </Box>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <TextField
          size="small"
          placeholder="Search descriptions..."
          value={expenseSearchFilter}
          onChange={(e) => setExpenseSearchFilter(e.target.value)}
          sx={{
            minWidth: 260,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#f8fafc',
              fontWeight: 600,
              '& fieldset': { borderColor: '#e2e8f0' },
            }
          }}
        />
        <Autocomplete
          size="small"
          options={['All', ...EXPENSE_CATEGORIES]}
          value={expenseCategoryFilter}
          onChange={(e, val) => setExpenseCategoryFilter(val || 'All')}
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter Category"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#f8fafc',
                  fontWeight: 600
                }
              }}
            />
          )}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddExpense}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' }
          }}
        >
          Add Expense
        </Button>
      </Stack>
    </Box>

    <TableContainer sx={{ flex: 1, borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'auto', bgcolor: '#ffffff' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569', py: 1.5 }}>DATE</TableCell>
            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>CATEGORY</TableCell>
            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>DESCRIPTION</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>METHOD</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>AMOUNT</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>DUE</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>STATUS</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>ACTIONS</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredExpenses.map((row) => (
            <TableRow
              key={row.id}
              onDoubleClick={() => onOpenPaymentHistoryDialog(row)}
              hover
              sx={{ '&:hover': { cursor: 'pointer' } }}
            >
              <TableCell sx={{ py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {new Date(row.date).getFullYear()}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={row.category?.toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.6rem',
                    bgcolor: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    height: 20
                  }}
                />
              </TableCell>
              <TableCell sx={{ maxWidth: 300 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{row.description}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {row.paymentMethod || 'CASH'}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, color: '#0f172a' }}>
                ₹{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right">
                {(row.dueAmount || 0) > 0 ? (
                  <Typography variant="body2" sx={{ fontWeight: 900, color: '#dc2626' }}>
                    ₹{row.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>SETTLED</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={row.paymentStatus?.toUpperCase() || 'PAID'}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    bgcolor: row.paymentStatus === 'Paid' ? '#f0fdf4' : row.paymentStatus === 'Due' ? '#fffbeb' : '#fef2f2',
                    color: row.paymentStatus === 'Paid' ? '#166534' : row.paymentStatus === 'Due' ? '#92400e' : '#991b1b',
                    border: `1px solid ${row.paymentStatus === 'Paid' ? '#16a34a' : row.paymentStatus === 'Due' ? '#f59e0b' : '#dc2626'}`,
                  }}
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  {(row.dueAmount || 0) > 0 && (
                    <IconButton size="small" onClick={() => onOpenPaymentDialog(row)} sx={{ bgcolor: '#f0fdf4', color: '#16a34a', '&:hover': { bgcolor: '#dcfce7' } }}>
                      <PaymentIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={() => onEditExpense(row)} sx={{ bgcolor: '#eff6ff', color: '#2563eb', '&:hover': { bgcolor: '#dbeafe' } }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDeleteExpense(row.id)} sx={{ bgcolor: '#fef2f2', color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {filteredExpenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <Box sx={{ opacity: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 800 }}>NO EXPENSES FOUND</Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Try adjusting your filters or date range</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {filteredExpenses.length > 0 && (
          <TableFooter
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: '#f8fafc',
              zIndex: 2,
              borderTop: '2px solid #e2e8f0',
              '& .MuiTableCell-root': { border: 'none' }
            }}
          >
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>
                  PERIOD TOTALS
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#3b82f6', display: 'block', fontSize: '0.65rem' }}>TOTAL AMOUNT</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  ₹{totalExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444', display: 'block', fontSize: '0.65rem' }}>TOTAL DUE</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#b91c1c' }}>
                  ₹{totalExpensesDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  </Box>
);

export default ExpenseListTab;

