import { useEffect, useState } from 'react';
import { IPC } from '@/shared/ipcChannels';
import type { LicenseStatusDto } from '@/shared/types/license';

/**
 * Live license status pushed from the Electron main process. Returns null in a plain browser (Vite dev
 * server, no `window.electron`) and until the first status arrives, so callers render nothing in both cases.
 */
export const useLicenseStatus = (): LicenseStatusDto | null => {
  const [status, setStatus] = useState<LicenseStatusDto | null>(null);

  useEffect(() => {
    const ipc = window.electron?.ipcRenderer;
    if (!ipc) return undefined;

    let cancelled = false;
    ipc
      .invoke<LicenseStatusDto>(IPC.LICENSE_GET_STATUS)
      .then((initial) => {
        if (!cancelled) setStatus(initial);
      })
      .catch(() => undefined);

    const onChanged = (_event: unknown, next: unknown): void => {
      if (!cancelled) setStatus(next as LicenseStatusDto);
    };
    ipc.on(IPC.LICENSE_STATUS_CHANGED, onChanged);

    return () => {
      cancelled = true;
      ipc.off(IPC.LICENSE_STATUS_CHANGED, onChanged);
    };
  }, []);

  return status;
};

export default useLicenseStatus;
