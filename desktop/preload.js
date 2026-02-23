const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    restartAppToUpdate: () => ipcRenderer.send('restart-app-to-update')
  },
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  }
});
