import { Alert, Button } from '@mui/material';
import useLicenseStatus from '@/shared/hooks/useLicenseStatus';
import { IPC } from '@/shared/ipcChannels';
import type { LicenseStatusDto } from '@/shared/types/license';

const QUIET_MODES: ReadonlyArray<LicenseStatusDto['mode']> = ['disabled', 'checking', 'active'];

interface LicenseBannerViewProps {
  status: LicenseStatusDto | null;
  onRefresh: () => void;
}

export const LicenseBannerView = ({ status, onRefresh }: LicenseBannerViewProps) => {
  if (!status || !status.message || status.severity === 'none' || QUIET_MODES.includes(status.mode))
    return null;

  const showRefresh = status.severity !== 'info' || status.offline;

  return (
    <Alert
      data-testid="license-banner"
      severity={status.severity}
      variant="filled"
      sx={{ borderRadius: 0, py: 0.25, alignItems: 'center' }}
      action={
        showRefresh ? (
          <Button color="inherit" size="small" onClick={onRefresh}>
            Check again
          </Button>
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
  const onRefresh = (): void => {
    void window.electron?.ipcRenderer.invoke(IPC.LICENSE_REFRESH);
  };
  return <LicenseBannerView status={status} onRefresh={onRefresh} />;
};

export default LicenseBanner;
