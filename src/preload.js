const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blazeAPI', {
  getQuarantineList: () => ipcRenderer.invoke('get-quarantine-list'),
  restoreFile: (id) => ipcRenderer.invoke('restore-file', id),
  deleteFile: (id) => ipcRenderer.invoke('delete-file', id)
});
