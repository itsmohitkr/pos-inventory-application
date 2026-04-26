import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import api from '@/shared/api/api';

const ChangePasswordDialog = ({ open, onClose, currentUser, showSuccess }) => {
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    try {
      await api.put(`/api/auth/users/${currentUser.id}/change-password`, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      onClose();
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess('Password changed successfully');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        window.dispatchEvent(new Event('pos-refocus'));
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {passwordError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {passwordError}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Old Password"
            type="password"
            fullWidth
            size="small"
            value={passwordData.oldPassword}
            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            size="small"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            size="small"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => {
            onClose();
            window.dispatchEvent(new Event('pos-refocus'));
          }}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button onClick={handleChangePassword} variant="contained">
          Change Password
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
