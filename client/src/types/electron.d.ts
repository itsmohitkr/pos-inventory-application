/**
 * Ambient types for the `window.electron` bridge exposed by desktop/preload.js
 * via contextBridge.exposeInMainWorld.
 *
 * This must stay in sync with desktop/preload.js. The bridge is absent when the
 * app runs in a plain browser (Vite dev server), which is why `electron` is
 * optional on Window — every call site has to guard with `window.electron?.`.
 */

/** Listener signature matching Electron's IpcRendererEvent callback. */
type IpcListener = (event: unknown, ...args: unknown[]) => void;

export interface ElectronIpcRenderer {
  send(channel: string, ...args: unknown[]): void;
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  on(channel: string, listener: IpcListener): void;
  off(channel: string, listener: IpcListener): void;
  removeAllListeners(channel: string): void;
}

export interface ElectronApp {
  getVersion(): Promise<string>;
  getAppPath(): Promise<string>;
}

export interface ElectronBridge {
  app: ElectronApp;
  ipcRenderer: ElectronIpcRenderer;
}

declare global {
  interface Window {
    /** Present only under Electron; undefined in a browser. */
    electron?: ElectronBridge;
  }
}

export {};
