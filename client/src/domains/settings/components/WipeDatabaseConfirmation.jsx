import React from 'react';
import { Alert, Box, TextField, Typography } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const WipeDatabaseConfirmation = ({ wipePassword, setWipePassword, currentUser }) => {
  return (
    <Box>
      <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ⚠️ FINAL WARNING
        </Typography>
        <Typography variant="body1" gutterBottom>
          You are about to permanently delete:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>All products and inventory batches</li>
          <li>All sales records and transaction history</li>
          <li>All categories and subcategories</li>
          <li>All user accounts (except yours)</li>
        </Box>
        <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
          This action is IRREVERSIBLE and will take effect immediately!
        </Typography>
      </Alert>

      <Typography variant="body1" sx={{ mb: 2 }}>
        To proceed, enter your admin password:
      </Typography>

      <TextField
        label="Admin Password"
        type="password"
        fullWidth
        value={wipePassword}
        onChange={(e) => setWipePassword(e.target.value)}
        autoFocus
        error={wipePassword.length > 0 && wipePassword.length < 4}
        helperText={wipePassword.length > 0 && wipePassword.length < 4 ? 'Password too short' : ''}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Logged in as: <strong>{currentUser?.username}</strong> (Admin)
      </Typography>
    </Box>
  );
};

export default WipeDatabaseConfirmation;
