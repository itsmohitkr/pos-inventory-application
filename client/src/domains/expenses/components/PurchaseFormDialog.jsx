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

const PurchaseFormDialog = ({
  open,
  onClose,
  onSubmit,
  purchaseForm,
  onFormChange,
  vendorOptions,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <form onSubmit={onSubmit}>
      <DialogTitle>{purchaseForm.id ? 'Edit Purchase' : 'Log Inventory Purchase'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Autocomplete
                sx={{ flex: 1 }}
                freeSolo
                options={vendorOptions}
                value={purchaseForm.vendor}
                onChange={(event, newValue) => onFormChange({ vendor: newValue || '' })}
                onInputChange={(event, newInputValue) => onFormChange({ vendor: newInputValue })}
                renderInput={(params) => <TextField {...params} label="Vendor Name" />}
              />
              <TextField
                sx={{ flex: 1 }}
                required
                disabled={!!purchaseForm.id}
                label="Total Amount"
                type="number"
                value={purchaseForm.totalAmount}
                onChange={(e) => onFormChange({ totalAmount: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                sx={{ flex: 1 }}
                label="Date"
                type="date"
                value={purchaseForm.date}
                onChange={(e) => onFormChange({ date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                sx={{ flex: 1 }}
                label="Amount Paid Now"
                type="number"
                disabled={!!purchaseForm.id}
                inputProps={{ min: 0, max: purchaseForm.totalAmount || 0, step: '0.01' }}
                value={purchaseForm.paidAmount}
                onChange={(e) => onFormChange({ paidAmount: e.target.value })}
                helperText={
                  purchaseForm.totalAmount && !purchaseForm.id
                    ? `Due: ₹${Math.max(0, (parseFloat(purchaseForm.totalAmount) || 0) - (parseFloat(purchaseForm.paidAmount) || 0)).toLocaleString()}`
                    : ''
                }
              />
              <TextField
                sx={{ flex: 1 }}
                select
                label="Method"
                value={purchaseForm.paymentMethod}
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
              label="Note"
              multiline
              rows={3}
              value={purchaseForm.note}
              onChange={(e) => onFormChange({ note: e.target.value })}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          type="submit"
          disabled={!purchaseForm.totalAmount}
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
          Record
        </Button>
      </DialogActions>
    </form>
  </Dialog>
);

export default PurchaseFormDialog;
