import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material';

interface AdminElevationDialogProps {
  open: boolean;
  onClose: () => void;
  adminPassword: string;
  setAdminPassword: (password: string) => void;
  /** Empty string when there is no error to show. */
  adminLoginError: string;
  onAdminLogin: () => void;
}

const AdminElevationDialog = ({
  open,
  onClose,
  adminPassword,
  setAdminPassword,
  adminLoginError,
  onAdminLogin,
}: AdminElevationDialogProps) => {
  const [showPassword, setShowPassword] = useState(false);

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
          type={showPassword ? 'text' : 'password'}
          fullWidth
          size="small"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdminLogin();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword((show) => !show)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
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
