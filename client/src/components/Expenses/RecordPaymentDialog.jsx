import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

/**
 * Unified dialog for recording a payment against a purchase or expense.
 * Props:
 *   open, onClose, onSubmit, title,
 *   totalLabel, totalValue, dueAmount,
 *   paymentForm, onPaymentFormChange,
 *   minDate  (optional ISO date string — min for the date field)
 */
const RecordPaymentDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  totalLabel,
  totalValue,
  dueAmount,
  paymentForm,
  onPaymentFormChange,
  minDate,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <form onSubmit={onSubmit}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(totalValue != null || dueAmount != null) && (
            <Box sx={{ mb: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              {totalValue != null && (
                <Typography variant="body2" color="text.secondary">
                  {totalLabel}: ₹{Number(totalValue).toLocaleString()}
                </Typography>
              )}
              <Typography variant="body1" fontWeight="bold" color="error.main">
                Due Amount: ₹{Number(dueAmount).toLocaleString()}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              required
              sx={{ flex: 2 }}
              label="Payment Amount"
              type="number"
              inputProps={{ max: dueAmount || 0, step: '0.01' }}
              value={paymentForm.amount}
              onChange={(e) => onPaymentFormChange({ amount: e.target.value })}
            />
            <TextField
              required
              sx={{ flex: 1 }}
              select
              label="Method"
              value={paymentForm.paymentMethod}
              onChange={(e) => onPaymentFormChange({ paymentMethod: e.target.value })}
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
            required
            fullWidth
            label="Payment Date"
            type="date"
            inputProps={{ min: minDate || '' }}
            value={paymentForm.date}
            onChange={(e) => onPaymentFormChange({ date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Note (Optional)"
            multiline
            rows={2}
            value={paymentForm.note}
            onChange={(e) => onPaymentFormChange({ note: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          type="submit"
          color="success"
          disabled={
            !paymentForm.amount ||
            parseFloat(paymentForm.amount) <= 0 ||
            parseFloat(paymentForm.amount) > (dueAmount || 0)
          }
        >
          Record Payment
        </Button>
      </DialogActions>
    </form>
  </Dialog>
);

export default RecordPaymentDialog;
