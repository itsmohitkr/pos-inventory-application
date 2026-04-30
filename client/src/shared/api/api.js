import axios from 'axios';
import { IPC } from '@/shared/ipcChannels';

export const isRequestCanceled = (error) => {
  return (
    axios.isCancel(error) ||
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError'
  );
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (isRequestCanceled(error)) {
    return '';
  }

  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  );
};

// In production Electron the renderer talks to Express through IPC instead of
// TCP so there is no network-stack overhead and no loopback port dependency.
// In the browser (Vite dev server) window.electron is absent, so axios uses its
// default HTTP adapter and all calls go directly to localhost:5001 unchanged.
const isElectronProd =
  typeof window !== 'undefined' &&
  !!window.electron?.ipcRenderer &&
  import.meta.env.PROD;

const ipcAdapter = isElectronProd
  ? async (config) => {
      const { method, url, data: body, params, signal } = config;

      let canceled = false;
      signal?.addEventListener('abort', () => {
        canceled = true;
      });

      const result = await window.electron.ipcRenderer.invoke(IPC.API_BRIDGE, {
        method,
        url,
        body,
        params,
      });

      if (canceled) {
        const cancelErr = new axios.Cancel('Request canceled');
        cancelErr.isCanceled = true;
        return Promise.reject(cancelErr);
      }

      if (result.status >= 400) {
        const err = new Error(result.data?.message || 'Request failed');
        err.response = { status: result.status, data: result.data, headers: result.headers };
        err.config = config;
        return Promise.reject(err);
      }

      return { data: result.data, status: result.status, headers: result.headers, config };
    }
  : undefined;

const api = axios.create({
  baseURL: import.meta.env.PROD ? 'http://localhost:5001' : '',
  timeout: 10000,
  ...(ipcAdapter ? { adapter: ipcAdapter } : {}),
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isRequestCanceled(error)) {
      error.isCanceled = true;
    }

    return Promise.reject(error);
  }
);

export default api;
