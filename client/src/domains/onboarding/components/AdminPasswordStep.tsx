import React, { useState } from 'react';
import { Stack, TextField, Typography, LinearProgress, Box, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { PasswordFields } from './useOnboarding';

function PasswordStrength({ password }: { password: string }) {
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

interface AdminPasswordStepProps {
  fields: PasswordFields;
  /** Curried by useOnboarding: onChange('adminPassword') returns the handler. */
  onChange: (field: keyof PasswordFields) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AdminPasswordStep({ fields, onChange }: AdminPasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        type={showPassword ? 'text' : 'password'}
        required
        fullWidth
        autoFocus
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword((show) => !show)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <PasswordStrength password={fields.adminPassword} />
      <TextField
        label="Confirm Password"
        value={fields.confirmPassword}
        onChange={onChange('confirmPassword')}
        type={showConfirmPassword ? 'text' : 'password'}
        required
        fullWidth
        error={mismatch}
        helperText={mismatch ? 'Passwords do not match' : ''}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle confirmation password visibility"
                onClick={() => setShowConfirmPassword((show) => !show)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}
