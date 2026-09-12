import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { dualCall } from '@/shared/api/ipc';
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
  fetchSettings: (config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.SETTING_GET_ALL, undefined, () => api.get('/api/settings', config)),

  /**
   * Update application settings
   */
  updateSettings: (settings: Record<string, unknown>, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.SETTING_UPDATE, settings, () => api.post('/api/settings', settings, config)),

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
  login: (credentials: LoginCredentials, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.AUTH_LOGIN, credentials, () => api.post('/api/auth/login', credentials, config)),

  verifyAdmin: (
    password: string,
    config: RequestConfig = {}
  ): Promise<VerifyAdminResult> =>
    dualCall(isElectronProd, IPC.AUTH_VERIFY_ADMIN, { password }, () =>
      api.post('/api/auth/verify-admin', { password }, config)
    ),

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
  fetchUsers: (config: RequestConfig = {}): Promise<User[]> =>
    dualCall(isElectronProd, IPC.AUTH_GET_ALL_USERS, undefined, () => api.get('/api/auth/users', config)),

  /**
   * User Management: Create a new user
   */
  createUser: (userData: Partial<User> & { password: string }, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.AUTH_CREATE_USER, { ...userData, adminToken: getAdminToken() }, () =>
      api.post('/api/auth/users', userData, config)
    ),

  /**
   * User Management: Update an existing user
   */
  updateUser: (id: number, userData: Partial<User> & { password?: string }, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.AUTH_UPDATE_USER, { id, ...userData, adminToken: getAdminToken() }, () =>
      api.put(`/api/auth/users/${id}`, userData, config)
    ),

  /**
   * User Management: Delete a user
   */
  deleteUser: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.AUTH_DELETE_USER, { id, adminToken: getAdminToken() }, () =>
      api.delete(`/api/auth/users/${id}`, config)
    ),

  /**
   * User Management: Change a user's own password
   */
  changePassword: (
    id: number,
    data: { oldPassword: string; newPassword: string },
    config: RequestConfig = {}
  ) =>
    dualCall(isElectronProd, IPC.AUTH_CHANGE_PASSWORD, { id, ...data }, () =>
      api.put(`/api/auth/users/${id}/change-password`, data, config)
    ),

  /**
   * System: Wipe entire database (Admin only)
   */
  wipeDatabase: (credentials: WipeDatabaseCredentials, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.AUTH_WIPE_DATABASE, credentials, () =>
      api.post('/api/auth/wipe-database', credentials, config)
    ),
};

export default settingsService;
