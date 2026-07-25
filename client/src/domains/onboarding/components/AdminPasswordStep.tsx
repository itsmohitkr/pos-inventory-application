import React from 'react';
import { Stack, TextField, Typography, LinearProgress, Box } from '@mui/material';

function PasswordStrength({ password }) {
  const len = password.length;
  const value = Math.min((len / 12) * 100, 100);
  const color = len === 0 ? 'inherit' : len < 8 ? 'error' : len < 12 ? 'warning' : 'success';
  const label = len === 0 ? '' : len < 8 ? `${len} chars — min 8 required` : `${len} chars — strong`;

  return (
    <Box>
      <LinearProgress variant="determinate" value={value} color={color === 'inherit' ? 'primary' : color} sx={{ height: 6, borderRadius: 3 }} />
      {label && (
        <Typography variant="caption" color={color === 'error' ? 'error' : color === 'warning' ? 'warning.main' : 'success.main'}>
          {label}
        </Typography>
      )}
    </Box>
  );
}

export default function AdminPasswordStep({ fields, onChange }) {
  const mismatch = fields.confirmPassword.length > 0 && fields.adminPassword !== fields.confirmPassword;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Set a secure admin password (minimum 8 characters). The default <strong>admin123</strong> password will be replaced.
      </Typography>
      <TextField
        label="New Admin Password"
        value={fields.adminPassword}
        onChange={onChange('adminPassword')}
        type="password"
        required
        fullWidth
        autoFocus
      />
      <PasswordStrength password={fields.adminPassword} />
      <TextField
        label="Confirm Password"
        value={fields.confirmPassword}
        onChange={onChange('confirmPassword')}
        type="password"
        required
        fullWidth
        error={mismatch}
        helperText={mismatch ? 'Passwords do not match' : ''}
      />
    </Stack>
  );
}
