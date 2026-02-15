const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path')
  }
});
