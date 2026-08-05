import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

type IpcListener = (event: IpcRendererEvent, ...args: unknown[]) => void;

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
  },
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: IpcListener) => ipcRenderer.on(channel, listener),
    off: (channel: string, listener: IpcListener) => ipcRenderer.removeListener(channel, listener),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  },
});
