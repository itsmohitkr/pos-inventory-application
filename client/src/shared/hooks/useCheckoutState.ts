import { useEffect, useState } from 'react';
import { IPC } from '@/shared/ipcChannels';
import type { CheckoutState } from '@/shared/types/license';

const IDLE: CheckoutState = { phase: 'idle', checkoutUrl: null };

/**
 * Live checkout status pushed from the Electron main process (P6.5) — the same pattern as useLicenseStatus.
 * Returns the idle state in a plain browser (no window.electron) and until the first real state arrives, so a
 * dialog mounted before the initial fetch resolves never flashes an undefined/loading state.
 */
export const useCheckoutState = (): CheckoutState => {
  const [state, setState] = useState<CheckoutState>(IDLE);

  useEffect(() => {
    const ipc = window.electron?.ipcRenderer;
    if (!ipc) return undefined;

    let cancelled = false;
    ipc
      .invoke<CheckoutState>(IPC.LICENSE_GET_CHECKOUT_STATE)
      .then((initial) => {
        if (!cancelled) setState(initial);
      })
      .catch(() => undefined);

    const onChanged = (_event: unknown, next: unknown): void => {
      if (!cancelled) setState(next as CheckoutState);
    };
    ipc.on(IPC.LICENSE_CHECKOUT_STATE_CHANGED, onChanged);

    return () => {
      cancelled = true;
      ipc.off(IPC.LICENSE_CHECKOUT_STATE_CHANGED, onChanged);
    };
  }, []);

  return state;
};

export default useCheckoutState;
