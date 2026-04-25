import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

const AdminElevationDialog = ({
  open,
  onClose,
  adminPassword,
  setAdminPassword,
  adminLoginError,
  onAdminLogin,
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LockIcon color="warning" /> Admin Elevation
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the admin password to temporarily access administrative functions.
        </Typography>
        {adminLoginError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {adminLoginError}
          </Typography>
        )}
        <TextField
          autoFocus
          label="Admin Password"
          type="password"
          fullWidth
          size="small"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdminLogin();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onAdminLogin} variant="contained" color="warning">
          Elevate
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminElevationDialog;
