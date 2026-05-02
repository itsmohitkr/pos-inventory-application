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
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: 'center' }}
      spacing={2}
      sx={{ mb: 2.5, px: 1 }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Operating Expenses</Typography>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Track recurring costs and bills</Typography>
      </Box>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search descriptions..."
          value={expenseSearchFilter}
          onChange={(e) => setExpenseSearchFilter(e.target.value)}
          sx={{ 
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
            }
          }}
        />
        <Autocomplete
          size="small"
          options={['All', ...EXPENSE_CATEGORIES]}
          value={expenseCategoryFilter}
          onChange={(e, val) => setExpenseCategoryFilter(val || 'All')}
          sx={{ minWidth: 180 }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Category" 
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '10px',
                  bgcolor: '#f8fafc'
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
    </Stack>

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
                  label={row.category} 
                  size="small" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.65rem', 
                    bgcolor: '#f1f5f9', 
                    color: '#475569',
                    border: '1px solid #e2e8f0'
                  }} 
                />
              </TableCell>
              <TableCell sx={{ maxWidth: 300 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{row.description}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {row.paymentMethod || 'Cash'}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#1e293b' }}>
                ₹{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right">
                {(row.dueAmount || 0) > 0 ? (
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                    ₹{row.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Settled</Typography>
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
                    border: '1px solid currentColor'
                  }} 
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  {(row.dueAmount || 0) > 0 && (
                    <IconButton size="small" onClick={() => onOpenPaymentDialog(row)} sx={{ bgcolor: '#f0fdf4', color: '#16a34a', '&:hover': { bgcolor: '#dcfce7' } }}>
                      <PaymentIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={() => onEditExpense(row)} sx={{ bgcolor: '#eff6ff', color: '#2563eb', '&:hover': { bgcolor: '#dbeafe' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDeleteExpense(row.id)} sx={{ bgcolor: '#fef2f2', color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {filteredExpenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>No operating expenses found.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>

    {filteredExpenses.length > 0 && (
      <Box 
        sx={{ 
          display: 'flex', 
          mt: 2, 
          p: 2, 
          borderRadius: '12px', 
          bgcolor: '#f0fdf4', 
          border: '1px solid #dcfce7',
          justifyContent: 'flex-end',
          gap: 4
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', display: 'block' }}>TOTAL EXPENDITURE</Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#065f46' }}>₹{totalExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#991b1b', display: 'block' }}>TOTAL OUTSTANDING</Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#7f1d1d' }}>₹{totalExpensesDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
        </Box>
      </Box>
    )}
  </Box>
);

export default ExpenseListTab;
);

export default ExpenseListTab;
