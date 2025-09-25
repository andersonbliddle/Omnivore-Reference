const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getImagesFromDirectory: (directoryPath) => ipcRenderer.invoke('get-images-from-directory', directoryPath),
  
  // Settings management
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Fullscreen toggle
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  
  // No keyboard shortcuts - button controls only
});