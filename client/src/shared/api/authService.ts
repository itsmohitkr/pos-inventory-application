import api, { isElectronProd } from './api';
import { invokeIpc } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';

/** Payload accepted by POST /api/auth/complete-onboarding. */
export interface CompleteOnboardingPayload {
  shopName: string;
  adminPassword: string;
  address?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  gst?: string;
  logo?: string;
}

const authService = {
  completeOnboarding: (data: CompleteOnboardingPayload) => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_COMPLETE_ONBOARDING, data);
    }
    return api.post('/api/auth/complete-onboarding', data);
  },
};

export default authService;
