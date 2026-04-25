import api from '@/shared/api/api';

/**
 * Settings Service
 * Centralizes all configuration and authentication related API calls.
 */
const settingsService = {
  /**
   * Fetch application settings
   */
  fetchSettings: async (config = {}) => {
    const response = await api.get('/api/settings', config);
    return response.data;
  },

  /**
   * Update application settings
   */
  updateSettings: async (settings, config = {}) => {
    const response = await api.post('/api/settings', settings, config);
    return response.data;
  },

  /**
   * Fetch system printers (Backend call)
   */
  fetchPrinters: async (config = {}) => {
    const response = await api.get('/api/settings/printers', config);
    return response.data;
  },

  /**
   * Authentication: Login
   */
  login: async (credentials, config = {}) => {
    const response = await api.post('/api/auth/login', credentials, config);
    return response.data;
  },

  verifyAdmin: async (password, config = {}) => {
    const response = await api.post('/api/auth/verify-admin', { password }, config);
    return response.data;
  },

  changePasscode: async (oldPassword, newPassword, config = {}) => {
    const response = await api.post(
      '/api/auth/change-passcode',
      { oldPassword, newPassword },
      config
    );
    return response.data;
  },

  /**
   * User Management: Fetch all users
   */
  fetchUsers: async (config = {}) => {
    const response = await api.get('/api/auth/users', config);
    return response.data;
  },

  /**
   * User Management: Create a new user
   */
  createUser: async (userData, config = {}) => {
    const response = await api.post('/api/auth/users', userData, config);
    return response.data;
  },

  /**
   * User Management: Update an existing user
   */
  updateUser: async (id, userData, config = {}) => {
    const response = await api.put(`/api/auth/users/${id}`, userData, config);
    return response.data;
  },

  /**
   * User Management: Delete a user
   */
  deleteUser: async (id, config = {}) => {
    const response = await api.delete(`/api/auth/users/${id}`, config);
    return response.data;
  },

  /**
   * System: Wipe entire database (Admin only)
   */
  wipeDatabase: async (credentials, config = {}) => {
    const response = await api.post('/api/auth/wipe-database', credentials, config);
    return response.data;
  },
};

export default settingsService;
