// Connects the licensing state (owned by desktop/license, started early in main.ts) to the shared sales gate
// that the sale IPC handlers and the Express sale routes both consult. Runs after the server modules are
// loadable, which is why it lives with the other domain IPC registrations instead of in initLicensing.
import { getLicenseManager } from '../license';
import { setSalesGate } from './ipcHelpers';

export const registerLicenseGate = (): void => {
  const manager = getLicenseManager();
  if (!manager) return;

  setSalesGate(() => {
    const decision = manager.evaluateSalesGate();
    if (decision.allowed) return { allowed: true };
    return {
      allowed: false,
      reason: decision.reason ?? 'LICENSE_EXPIRED',
      message: decision.message ?? 'New sales are currently blocked.',
    };
  });
};
