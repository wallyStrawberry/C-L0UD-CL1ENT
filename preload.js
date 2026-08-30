const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cloudClient', {
  isDesktop: true,
  loadProfiles: () => ipcRenderer.invoke('profiles:load'),
  saveProfiles: profiles => ipcRenderer.invoke('profiles:save', profiles),
  installModrinth: details => ipcRenderer.invoke('modrinth:install', details)
});