import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import EnterActivationKeyDialog from '@/shared/components/EnterActivationKeyDialog';
import UpgradeDialog from '@/shared/components/UpgradeDialog';
import useLicenseStatus from '@/shared/hooks/useLicenseStatus';
import { IPC } from '@/shared/ipcChannels';
import type { LicenseStatusDto } from '@/shared/types/license';

// 'active' is deliberately NOT quiet (P6.6): licensePolicy.ts's evaluateLicense now gives it a real
// severity/message in the last RENEWAL_REMINDER_DAYS of a still-fully-paid period (the renewal reminder), and
// `severity === 'none'` below already suppresses it the rest of the time — same mechanism 'trialing'/'checking'
// rely on, so nothing here needed to special-case the reminder further.
const QUIET_MODES: ReadonlyArray<LicenseStatusDto['mode']> = ['disabled', 'checking'];
/** Modes where typing a key is a plausible next step. Kept narrow: revoked/unverified need support, not a key,
 *  and 'active' never needs a key at all (see OFFERS_UPGRADE below for its one action). */
const OFFERS_ENTER_KEY: ReadonlyArray<LicenseStatusDto['mode']> = [
  'trialing',
  'past_due',
  'grace',
  'lapsed',
];
/** OFFERS_ENTER_KEY's modes, plus 'active': the renewal reminder's whole point is offering the same
 *  self-serve Upgrade/Renew flow (P6.5) proactively, before the period actually ends. The button is still
 *  gated by the banner rendering at all (severity !== 'none'), so it only ever appears alongside the
 *  reminder message itself, never for an 'active' account with time to spare. */
const OFFERS_UPGRADE: ReadonlyArray<LicenseStatusDto['mode']> = [...OFFERS_ENTER_KEY, 'active'];

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
