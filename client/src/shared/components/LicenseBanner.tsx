import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import EnterActivationKeyDialog from '@/shared/components/EnterActivationKeyDialog';
import UpgradeDialog from '@/shared/components/UpgradeDialog';
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
/** Same set as OFFERS_ENTER_KEY: a self-serve Upgrade (P6.5) is the other way to resolve exactly these modes,
 *  offered alongside the manual key path rather than instead of it. */
const OFFERS_UPGRADE: ReadonlyArray<LicenseStatusDto['mode']> = OFFERS_ENTER_KEY;

interface LicenseBannerViewProps {
  status: LicenseStatusDto | null;
  onRefresh: () => void;
  onEnterKey: () => void;
  onUpgrade: () => void;
}

export const LicenseBannerView = ({
  status,
  onRefresh,
  onEnterKey,
  onUpgrade,
}: LicenseBannerViewProps) => {
  if (!status || !status.message || status.severity === 'none' || QUIET_MODES.includes(status.mode))
    return null;

  const showRefresh = status.severity !== 'info' || status.offline;
  const showEnterKey = OFFERS_ENTER_KEY.includes(status.mode);
  const showUpgrade = OFFERS_UPGRADE.includes(status.mode);

  return (
    <Alert
      data-testid="license-banner"
      severity={status.severity}
      variant="filled"
      sx={{ borderRadius: 0, py: 0.25, alignItems: 'center' }}
      action={
        showRefresh || showEnterKey || showUpgrade ? (
          <Stack direction="row" spacing={1}>
            {showUpgrade && (
              <Button color="inherit" size="small" onClick={onUpgrade}>
                Upgrade
              </Button>
            )}
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
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const onRefresh = (): void => {
    void window.electron?.ipcRenderer.invoke(IPC.LICENSE_REFRESH);
  };
  return (
    <>
      <LicenseBannerView
        status={status}
        onRefresh={onRefresh}
        onEnterKey={() => setKeyDialogOpen(true)}
        onUpgrade={() => setUpgradeDialogOpen(true)}
      />
      <EnterActivationKeyDialog open={keyDialogOpen} onClose={() => setKeyDialogOpen(false)} />
      <UpgradeDialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} />
    </>
  );
};

export default LicenseBanner;
