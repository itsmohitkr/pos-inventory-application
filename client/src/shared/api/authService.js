import api from './api';

const authService = {
  completeOnboarding: (data) => api.post('/api/auth/complete-onboarding', data),
};

export default authService;
