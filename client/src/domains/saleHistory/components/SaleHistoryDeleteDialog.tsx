import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';

const SaleHistoryDeleteDialog = ({ deleteLooseId, onClose, onConfirm }) => (
  <Dialog
    open={Boolean(deleteLooseId)}
    onClose={onClose}
    PaperProps={{
      sx: { p: 1 },
    }}
  >
    <DialogTitle
      sx={{
        fontWeight: 800,
        color: '#d32f2f',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <DeleteIcon color="error" />
      Delete Loose Sale?
    </DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ fontWeight: 500 }}>
        Are you sure you want to permanently delete this loose sale record (LOO-{deleteLooseId})?
        This action cannot be undone and will be removed from all financial reports.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        color="inherit"
        sx={{ fontWeight: 700, borderRadius: 2 }}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="error"
        sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}
      >
        Yes, Delete Record
      </Button>
    </DialogActions>
  </Dialog>
);

export default React.memo(SaleHistoryDeleteDialog);
