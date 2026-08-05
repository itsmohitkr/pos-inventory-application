import api from './api';

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
  completeOnboarding: (data: CompleteOnboardingPayload) =>
    api.post('/api/auth/complete-onboarding', data),
};

export default authService;
