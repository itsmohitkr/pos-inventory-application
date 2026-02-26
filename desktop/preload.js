const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path')
  },
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    off: (channel, listener) => ipcRenderer.removeListener(channel, listener),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  }
});
