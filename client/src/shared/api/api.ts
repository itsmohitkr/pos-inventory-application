import axios from 'axios';
import type {
  AxiosAdapter,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  Cancel,
} from 'axios';
import { IPC } from '@/shared/ipcChannels';

/** Error shape after the response interceptor tags cancellations. */
export interface ApiError extends Error {
  response?: { status: number; data?: ApiErrorBody; headers?: unknown };
  config?: AxiosRequestConfig;
  code?: string;
  isCanceled?: boolean;
}

/** Error envelope emitted by the Express errorHandler. */
interface ApiErrorBody {
  message?: string;
  error?: string;
  details?: unknown;
}

/** Payload returned by the main-process API bridge handler. */
interface BridgeResult {
  status: number;
  data?: ApiErrorBody & Record<string, unknown>;
  headers?: Record<string, string>;
}

export const isRequestCanceled = (error: unknown): boolean => {
  const err = error as ApiError | undefined;
  return (
    axios.isCancel(error) ||
    err?.code === 'ERR_CANCELED' ||
    err?.name === 'CanceledError' ||
    err?.name === 'AbortError'
  );
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong'
): string => {
  if (isRequestCanceled(error)) {
    return '';
  }

  const err = error as ApiError | undefined;
  return (
    err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback
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

const ipcAdapter: AxiosAdapter | undefined = isElectronProd
  ? async (config) => {
      const { method, url, data: body, params, signal } = config;

      let canceled = false;
      signal?.addEventListener('abort', () => {
        canceled = true;
      });

      const result = await window.electron!.ipcRenderer.invoke<BridgeResult>(IPC.API_BRIDGE, {
        method,
        url,
        body,
        params,
      });

      if (canceled) {
        const cancelErr = new axios.Cancel('Request canceled') as Cancel & {
          isCanceled?: boolean;
        };
        cancelErr.isCanceled = true;
        return Promise.reject(cancelErr);
      }

      if (result.status >= 400) {
        const err = new Error(result.data?.message || 'Request failed') as ApiError;
        err.response = { status: result.status, data: result.data, headers: result.headers };
        err.config = config;
        return Promise.reject(err);
      }

      return {
        data: result.data,
        status: result.status,
        headers: result.headers,
        config,
      } as AxiosResponse;
    }
  : undefined;

const api = axios.create({
  baseURL: import.meta.env.PROD ? 'http://localhost:5001' : '',
  timeout: 10000,
  ...(ipcAdapter ? { adapter: ipcAdapter } : {}),
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (isRequestCanceled(error)) {
      (error as ApiError).isCanceled = true;
    }

    return Promise.reject(error);
  }
);

export default api;
