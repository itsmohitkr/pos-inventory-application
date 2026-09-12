import React, { useState } from 'react';
import type { AuthUser } from '@/shared/types/auth';
import { Alert, Box, TextField, Typography, IconButton, InputAdornment, Paper } from '@mui/material';
import { Warning as WarningIcon, Visibility, VisibilityOff } from '@mui/icons-material';

export const CONFIRM_PHRASE = 'WIPE ALL DATA';

interface WipeDatabaseConfirmationProps {
  wipePassword: string;
  setWipePassword: (value: string) => void;
  /** Must equal CONFIRM_PHRASE before the wipe is allowed. */
  confirmPhrase: string;
  setConfirmPhrase: (value: string) => void;
  currentUser?: AuthUser | null;
}

const WipeDatabaseConfirmation = ({
  wipePassword, setWipePassword,
  confirmPhrase, setConfirmPhrase,
  currentUser,
}: WipeDatabaseConfirmationProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const phraseCorrect = confirmPhrase === CONFIRM_PHRASE;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: '10px',
        border: '1px solid #fecaca',
        bgcolor: '#ffffff',
      }}
    >
      <Alert
        severity="error"
        icon={<WarningIcon />}
        variant="outlined"
        sx={{
          mb: 3,
          borderRadius: '8px',
          bgcolor: '#fffbfb',
          border: '1px solid #fca5a5',
          '& .MuiAlert-message': { color: '#991b1b' },
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          FINAL WARNING: DATABASE WIPE
        </Typography>
        <Typography variant="body2" gutterBottom>
          You are about to permanently delete:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2, mb: 1, fontSize: '0.875rem' }}>
          <li>All products and inventory batches</li>
          <li>All sales records and transaction history</li>
          <li>All categories and subcategories</li>
          <li>All user accounts (except your current admin account)</li>
        </Box>
        <Typography variant="caption" sx={{ mt: 1, fontWeight: 700, display: 'block', color: '#b91c1c' }}>
          This action is IRREVERSIBLE and will take effect immediately.
        </Typography>
      </Alert>

      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0b1d39', mb: 1.5 }}>
        To proceed, enter your admin password:
      </Typography>

      <TextField
        label="Admin Password"
        type={showPassword ? 'text' : 'password'}
        fullWidth
        size="small"
        value={wipePassword}
        onChange={(e) => setWipePassword(e.target.value)}
        autoFocus
        error={wipePassword.length > 0 && wipePassword.length < 4}
        helperText={wipePassword.length > 0 && wipePassword.length < 4 ? 'Password too short' : ''}
        sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle wipe password visibility"
                onClick={() => setShowPassword((show) => !show)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0b1d39', mb: 1 }}>
        Type <strong>{CONFIRM_PHRASE}</strong> to confirm:
      </Typography>

      <TextField
        label="Confirmation phrase"
        fullWidth
        size="small"
        value={confirmPhrase}
        onChange={(e) => setConfirmPhrase(e.target.value)}
        error={confirmPhrase.length > 0 && !phraseCorrect}
        helperText={
          confirmPhrase.length > 0 && !phraseCorrect
            ? `Must be exactly "${CONFIRM_PHRASE}"`
            : ''
        }
        inputProps={{ spellCheck: false }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Logged in as: <strong>{currentUser?.username}</strong> (Admin)
      </Typography>
    </Paper>
  );
};

export default WipeDatabaseConfirmation;
