import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Autocomplete,
} from '@mui/material';

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

const ExpenseFormDialog = ({ open, onClose, onSubmit, expenseForm, onFormChange, categories }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <form onSubmit={onSubmit}>
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
                onChange={(e) => onFormChange({ amount: e.target.value })}
              />
              <Autocomplete
                sx={{ flex: 1 }}
                freeSolo
                options={categories}
                value={expenseForm.category}
                onChange={(event, newValue) => onFormChange({ category: newValue || '' })}
                onInputChange={(event, newInputValue) => onFormChange({ category: newInputValue })}
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
                onChange={(e) => onFormChange({ date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                sx={{ flex: 1 }}
                label="Amount Paid Now"
                type="number"
                disabled={!!expenseForm.id}
                inputProps={{ min: 0, max: expenseForm.amount || 0, step: '0.01' }}
                value={expenseForm.paidAmount}
                onChange={(e) => onFormChange({ paidAmount: e.target.value })}
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
                onChange={(e) => onFormChange({ paymentMethod: e.target.value })}
                SelectProps={{ native: true }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </TextField>
            </Box>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={expenseForm.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          type="submit"
          disabled={!expenseForm.amount || !expenseForm.category || !expenseForm.date}
          sx={{
            color: '#ffffff',
            bgcolor: '#0b1d39',
            '&:hover': { bgcolor: '#1a365d' },
            '&.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.5)',
              bgcolor: 'rgba(11, 29, 57, 0.5)',
            },
          }}
        >
          Successful
        </Button>
      </DialogActions>
    </form>
  </Dialog>
);

export default ExpenseFormDialog;
