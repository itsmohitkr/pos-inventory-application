import type { ApiError } from '@/shared/api/api';

/** Payload shape every migrated desktop/ipc/*.ipc.ts handler resolves with. */
interface IpcResult<T> {
  status: number;
  body?: (T & { message?: string; error?: string; details?: unknown }) | undefined;
}

/**
 * Calls a native IPC channel registered by desktop/ipc/*.ipc.ts and shapes
 * the result exactly the way api.ts's ipcAdapter already shapes api-bridge
 * results — so a thrown error here has the same `{response: {status, data}}`
 * shape axios/api-bridge errors already have, and every existing
 * `getApiErrorMessage`/`err.response?.data?.message` call site keeps working
 * unchanged regardless of which transport a given domain has been migrated
 * to. See the IPC migration plan for the full rationale.
 *
 * Only usable once window.electron is present (packaged Electron / electron-dev).
 * Domain API wrapper functions call this directly; components never do.
 */
export const invokeIpc = async <T = unknown>(
  channel: string,
  payload?: unknown
): Promise<T> => {
  if (!window.electron?.ipcRenderer) {
    throw new Error(
      `invokeIpc('${channel}') called without window.electron — this path only works in a packaged/electron-dev build.`
    );
  }

  const result = await window.electron.ipcRenderer.invoke<IpcResult<T>>(channel, payload);

  if (result.status >= 400) {
    const err = new Error(result.body?.message || 'Request failed') as ApiError;
    err.response = { status: result.status, data: result.body };
    return Promise.reject(err);
  }

  return result.body as T;
};
