import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Upgrade as UpgradeIcon,
} from '@mui/icons-material';
import useCheckoutState from '@/shared/hooks/useCheckoutState';
import { IPC } from '@/shared/ipcChannels';
import type { CheckoutStartResult } from '@/shared/types/license';

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
}

interface PlanOption {
  key: string;
  label: string;
  /** No price shown: pricing is still an open decision server-side (see the service's price list), and the
   *  hosted checkout page itself shows the real amount before any payment detail is entered. */
  description: string;
}

const PLANS: readonly PlanOption[] = [
  { key: 'monthly', label: 'Monthly', description: 'Billed every month' },
  { key: 'yearly', label: 'Yearly', description: 'Billed once a year' },
];

/** One sentence per non-`ok` outcome LICENSE_START_CHECKOUT can report. The main process decides what
 *  happened; this only displays it — same convention as EnterActivationKeyDialog's MESSAGE_FOR. */
const START_ERROR_MESSAGE: Record<Exclude<CheckoutStartResult['kind'], 'ok'>, string> = {
  already_pending: 'A payment is already in progress for this device.',
  rejected: "This device isn't recognized by the license server. Try again in a moment.",
  unknown_plan: "That plan isn't available right now. Please try again or contact support.",
  offline: "Couldn't reach the license server. Check your internet connection and try again.",
};

const UpgradeDialog = ({ open, onClose }: UpgradeDialogProps) => {
  const checkout = useCheckoutState();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const startCheckout = async (plan: string): Promise<void> => {
    setStarting(true);
    setStartError(null);
    try {
      const result = await window.electron?.ipcRenderer.invoke<CheckoutStartResult>(
        IPC.LICENSE_START_CHECKOUT,
        plan
      );
      if (result && result.kind !== 'ok') setStartError(START_ERROR_MESSAGE[result.kind]);
      if (!result) setStartError(START_ERROR_MESSAGE.offline);
    } catch {
      setStartError(START_ERROR_MESSAGE.offline);
    } finally {
      setStarting(false);
    }
  };

  const cancel = (): void => {
    void window.electron?.ipcRenderer.invoke(IPC.LICENSE_CANCEL_CHECKOUT);
    setStartError(null);
  };

  const handleClose = (): void => {
    // Closing while a payment is genuinely in progress does not cancel it — the session keeps polling in the
    // main process (and resumes across a restart) so a person can safely dismiss the dialog and check back.
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UpgradeIcon color="primary" /> Upgrade
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {checkout.phase === 'idle' && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose a plan to continue. You&apos;ll complete payment in your browser.
            </Typography>
            {startError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {startError}
              </Alert>
            )}
            <Stack spacing={1.5}>
              {PLANS.map((plan) => (
                <Button
                  key={plan.key}
                  variant="outlined"
                  disabled={starting}
                  onClick={() => void startCheckout(plan.key)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.25 }}
                >
                  <Stack>
                    <Typography variant="body1" fontWeight={600}>
                      {plan.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {plan.description}
                    </Typography>
                  </Stack>
                </Button>
              ))}
            </Stack>
            {starting && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Starting checkout…
                </Typography>
              </Stack>
            )}
          </>
        )}

        {checkout.phase === 'pending' && (
          <Stack spacing={2} alignItems="center" sx={{ py: 2, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body1">Waiting for payment…</Typography>
            <Typography variant="body2" color="text.secondary">
              We opened a payment page in your browser. This closes automatically once payment is
              complete — you can leave this window open or come back to it later.
            </Typography>
          </Stack>
        )}

        {checkout.phase === 'paid' && (
          <Stack spacing={1.5} alignItems="center" sx={{ py: 2, textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
            <Typography variant="body1">Payment received. Your license is now active.</Typography>
          </Stack>
        )}

        {(checkout.phase === 'failed' || checkout.phase === 'expired') && (
          <Stack spacing={1.5} alignItems="center" sx={{ py: 2, textAlign: 'center' }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
            <Typography variant="body1">
              {checkout.phase === 'failed'
                ? 'The payment did not go through.'
                : 'This payment session expired before it was completed.'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No charge was made. You can try again below.
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {checkout.phase === 'idle' && <Button onClick={handleClose}>Close</Button>}
        {checkout.phase === 'pending' && <Button onClick={cancel}>Cancel</Button>}
        {checkout.phase === 'paid' && (
          <Button variant="contained" onClick={cancel}>
            Done
          </Button>
        )}
        {(checkout.phase === 'failed' || checkout.phase === 'expired') && (
          <>
            <Button onClick={cancel}>Close</Button>
            <Button variant="contained" onClick={cancel}>
              Try again
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeDialog;
