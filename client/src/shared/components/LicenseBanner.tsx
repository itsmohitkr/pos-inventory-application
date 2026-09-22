import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import EnterActivationKeyDialog from '@/shared/components/EnterActivationKeyDialog';
import useLicenseStatus from '@/shared/hooks/useLicenseStatus';
import { IPC } from '@/shared/ipcChannels';
import type { LicenseStatusDto } from '@/shared/types/license';

const QUIET_MODES: ReadonlyArray<LicenseStatusDto['mode']> = ['disabled', 'checking', 'active'];
/** Modes where typing a key is a plausible next step. Kept narrow: revoked/unverified need support, not a key. */
const OFFERS_ENTER_KEY: ReadonlyArray<LicenseStatusDto['mode']> = [
  'trialing',
  'past_due',
  'grace',
  'lapsed',
];

interface LicenseBannerViewProps {
  status: LicenseStatusDto | null;
  onRefresh: () => void;
  onEnterKey: () => void;
}

export const LicenseBannerView = ({ status, onRefresh, onEnterKey }: LicenseBannerViewProps) => {
  if (!status || !status.message || status.severity === 'none' || QUIET_MODES.includes(status.mode))
    return null;

  const showRefresh = status.severity !== 'info' || status.offline;
  const showEnterKey = OFFERS_ENTER_KEY.includes(status.mode);

  return (
    <Alert
      data-testid="license-banner"
      severity={status.severity}
      variant="filled"
      sx={{ borderRadius: 0, py: 0.25, alignItems: 'center' }}
      action={
        showRefresh || showEnterKey ? (
          <Stack direction="row" spacing={1}>
            {showEnterKey && (
              <Button color="inherit" size="small" onClick={onEnterKey}>
                Enter key
              </Button>
            )}
            {showRefresh && (
              <Button color="inherit" size="small" onClick={onRefresh}>
                Check again
              </Button>
            )}
          </Stack>
        ) : undefined
      }
    >
      {status.message}
      {status.clockSuspect
        ? " Your computer's clock looks wrong. Please check the date and time."
        : ''}
    </Alert>
  );
};

const LicenseBanner = () => {
  const status = useLicenseStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const onRefresh = (): void => {
    void window.electron?.ipcRenderer.invoke(IPC.LICENSE_REFRESH);
  };
  return (
    <>
      <LicenseBannerView
        status={status}
        onRefresh={onRefresh}
        onEnterKey={() => setDialogOpen(true)}
      />
      <EnterActivationKeyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
};

export default LicenseBanner;
