import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { invokeIpc } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';
import { getAdminToken } from '@/shared/api/adminToken';

/** Per-call axios options — used throughout for AbortController signals. */
type RequestConfig = AxiosRequestConfig;

/** Credentials accepted by POST /api/auth/login. */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** A user record as returned by the auth endpoints (never includes password). */
export interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Wipe requires the admin password *and* the typed confirmation phrase. */
/**
 * POST /api/auth/verify-admin. The token is the part that matters — the server
 * requires it on the user-management routes.
 */
export interface VerifyAdminResult {
  success: boolean;
  message?: string;
  adminToken?: string;
  adminTokenExpiresAt?: number;
}

export interface WipeDatabaseCredentials {
  username: string;
  password: string;
  confirmPhrase: string;
}

/**
 * Settings Service
 * Centralizes all configuration and authentication related API calls.
 */
const settingsService = {
  /**
   * Fetch application settings
   */
  fetchSettings: async (config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.SETTING_GET_ALL);
    }
    const response = await api.get('/api/settings', config);
    return response.data;
  },

  /**
   * Update application settings
   */
  updateSettings: async (settings: Record<string, unknown>, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.SETTING_UPDATE, settings);
    }
    const response = await api.post('/api/settings', settings, config);
    return response.data;
  },

  /**
   * Fetch system printers (Backend call)
   */
  fetchPrinters: async (config: RequestConfig = {}) => {
    const response = await api.get('/api/settings/printers', config);
    return response.data;
  },

  /**
   * Authentication: Login
   */
  login: async (credentials: LoginCredentials, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_LOGIN, credentials);
    }
    const response = await api.post('/api/auth/login', credentials, config);
    return response.data;
  },

  verifyAdmin: async (
    password: string,
    config: RequestConfig = {}
  ): Promise<VerifyAdminResult> => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_VERIFY_ADMIN, { password });
    }
    const response = await api.post('/api/auth/verify-admin', { password }, config);
    return response.data;
  },

  changePasscode: async (oldPassword: string, newPassword: string, config: RequestConfig = {}) => {
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
  fetchUsers: async (config: RequestConfig = {}): Promise<User[]> => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_GET_ALL_USERS);
    }
    const response = await api.get('/api/auth/users', config);
    return response.data;
  },

  /**
   * User Management: Create a new user
   */
  createUser: async (userData: Partial<User> & { password: string }, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_CREATE_USER, { ...userData, adminToken: getAdminToken() });
    }
    const response = await api.post('/api/auth/users', userData, config);
    return response.data;
  },

  /**
   * User Management: Update an existing user
   */
  updateUser: async (id: number, userData: Partial<User> & { password?: string }, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_UPDATE_USER, { id, ...userData, adminToken: getAdminToken() });
    }
    const response = await api.put(`/api/auth/users/${id}`, userData, config);
    return response.data;
  },

  /**
   * User Management: Delete a user
   */
  deleteUser: async (id: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_DELETE_USER, { id, adminToken: getAdminToken() });
    }
    const response = await api.delete(`/api/auth/users/${id}`, config);
    return response.data;
  },

  /**
   * User Management: Change a user's own password
   */
  changePassword: async (
    id: number,
    data: { oldPassword: string; newPassword: string },
    config: RequestConfig = {}
  ) => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_CHANGE_PASSWORD, { id, ...data });
    }
    const response = await api.put(`/api/auth/users/${id}/change-password`, data, config);
    return response.data;
  },

  /**
   * System: Wipe entire database (Admin only)
   */
  wipeDatabase: async (credentials: WipeDatabaseCredentials, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.AUTH_WIPE_DATABASE, credentials);
    }
    const response = await api.post('/api/auth/wipe-database', credentials, config);
    return response.data;
  },
};

export default settingsService;
