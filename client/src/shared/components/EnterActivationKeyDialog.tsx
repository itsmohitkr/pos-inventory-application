import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { VpnKey as VpnKeyIcon } from '@mui/icons-material';
import { IPC } from '@/shared/ipcChannels';
import type { RedeemKeyOutcome } from '@/shared/types/license';

interface EnterActivationKeyDialogProps {
  open: boolean;
  onClose: () => void;
}

/** One sentence per outcome the main process can report. The main process decides what happened; this only displays it. */
const MESSAGE_FOR: Record<RedeemKeyOutcome['kind'], string> = {
  ok: 'Activated. Your license is now active.',
  malformed: "That key doesn't look right. Double-check you typed or pasted it correctly.",
  invalid_key:
    "This activation key isn't valid. It may have already been used, expired, or been issued for a different device. Contact support if you think this is a mistake.",
  seat_limit_reached:
    'Every device allowed on this plan is already in use. Contact support to add more devices or free one up.',
  device_already_licensed:
    'This device is already licensed under a different account. Contact support to move it.',
  offline: "Couldn't reach the license server. Check your internet connection and try again.",
};

const EnterActivationKeyDialog = ({ open, onClose }: EnterActivationKeyDialogProps) => {
  const [key, setKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<RedeemKeyOutcome | null>(null);

  const reset = (): void => {
    setKey('');
    setSubmitting(false);
    setOutcome(null);
  };

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    const typed = key.trim();
    if (!typed || submitting) return;
    setSubmitting(true);
    setOutcome(null);
    try {
      const result = await window.electron?.ipcRenderer.invoke<RedeemKeyOutcome>(
        IPC.LICENSE_REDEEM_KEY,
        typed
      );
      setOutcome(result ?? { kind: 'offline' });
    } catch {
      setOutcome({ kind: 'offline' });
    } finally {
      setSubmitting(false);
    }
  };

  const success = outcome?.kind === 'ok';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VpnKeyIcon color="primary" /> Enter Activation Key
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the activation key you received to license this device.
        </Typography>
        {outcome && (
          <Alert severity={success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {MESSAGE_FOR[outcome.kind]}
          </Alert>
        )}
        {!success && (
          <TextField
            autoFocus
            label="Activation Key"
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XX"
            fullWidth
            size="small"
            value={key}
            disabled={submitting}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSubmit();
            }}
            slotProps={{ htmlInput: { autoCapitalize: 'characters', autoCorrect: 'off' } }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{success ? 'Close' : 'Cancel'}</Button>
        {!success && (
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={submitting || key.trim().length === 0}
          >
            {submitting ? 'Checking…' : 'Activate'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnterActivationKeyDialog;
