import React from 'react';
import type { PaymentFormState } from '@/domains/expenses/components/useExpenseManagement';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Menu,
  MenuItem,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

/**
 * Context menu (⋮) and inline edit-payment sub-dialog for payment records.
 * Props:
 *   menuAnchor, onCloseMenu,
 *   isEditDisabled, isDeleteDisabled,
 *   onOpenEditPayment, onDeletePayment,
 *   editDialogOpen, onCloseEditDialog, onEditSubmit,
 *   editPaymentForm, onEditFormChange,
 *   minDate  (optional)
 */
interface PaymentActionMenuProps {
  /** Null closes the menu. */
  menuAnchor?: HTMLElement | null;
  onCloseMenu: () => void;
  isEditDisabled?: boolean;
  isDeleteDisabled?: boolean;
  onOpenEditPayment: () => void;
  onDeletePayment: () => void;
  editDialogOpen: boolean;
  onCloseEditDialog: () => void;
  onEditSubmit: (e: React.FormEvent) => void;
  editPaymentForm: PaymentFormState;
  onEditFormChange: (update: Partial<PaymentFormState>) => void;
  /** YYYY-MM-DD lower bound — a payment cannot predate its purchase. */
  minDate?: string;
}

const PaymentActionMenu = ({
  menuAnchor,
  onCloseMenu,
  isEditDisabled,
  isDeleteDisabled,
  onOpenEditPayment,
  onDeletePayment,
  editDialogOpen,
  onCloseEditDialog,
  onEditSubmit,
  editPaymentForm,
  onEditFormChange,
  minDate,
}: PaymentActionMenuProps) => (
  <>
    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={onCloseMenu}>
      <MenuItem onClick={onOpenEditPayment} disabled={isEditDisabled}>
        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
      </MenuItem>
      <MenuItem
        onClick={() => {
          onDeletePayment();
          onCloseMenu();
        }}
        disabled={isDeleteDisabled}
        sx={{ color: 'error.main' }}
      >
        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
      </MenuItem>
    </Menu>

    <Dialog open={editDialogOpen} onClose={onCloseEditDialog} fullWidth maxWidth="xs">
      <form onSubmit={onEditSubmit}>
        <DialogTitle>Edit Payment Record</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                required
                sx={{ flex: 2 }}
                label="Amount"
                type="number"
                value={editPaymentForm.amount}
                onChange={(e) => onEditFormChange({ amount: e.target.value })}
              />
              <TextField
                required
                sx={{ flex: 1 }}
                select
                label="Method"
                value={editPaymentForm.paymentMethod}
                onChange={(e) => onEditFormChange({ paymentMethod: e.target.value })}
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
              label="Date"
              type="date"
              inputProps={{ min: minDate || '' }}
              value={editPaymentForm.date}
              onChange={(e) => onEditFormChange({ date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Note"
              multiline
              rows={2}
              value={editPaymentForm.note}
              onChange={(e) => onEditFormChange({ note: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEditDialog}>Cancel</Button>
          <Button variant="contained" type="submit" color="primary">
            Update Payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  </>
);

export default PaymentActionMenu;
