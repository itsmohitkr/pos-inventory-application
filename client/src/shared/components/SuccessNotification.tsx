import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor, SnackbarOrigin } from '@mui/material';

interface SuccessNotificationProps {
  open: boolean;
  message: React.ReactNode;
  onClose: () => void;
  duration?: number;
  severity?: AlertColor;
  anchorOrigin?: SnackbarOrigin;
}

const SuccessNotification = ({
  open,
  message,
  onClose,
  duration = 3000,
  severity = 'success',
  anchorOrigin = { vertical: 'top', horizontal: 'center' },
}: SuccessNotificationProps) => {
  return (
    <Snackbar open={open} autoHideDuration={duration} onClose={onClose} anchorOrigin={anchorOrigin}>
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 3,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SuccessNotification;
