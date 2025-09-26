const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getImagesFromDirectory: (directoryPath) => ipcRenderer.invoke('get-images-from-directory', directoryPath),
  
  // Settings management
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Backup management
  getBackupList: () => ipcRenderer.invoke('get-backup-list'),
  restoreFromBackup: (backupFilename) => ipcRenderer.invoke('restore-from-backup', backupFilename),
  createManualBackup: () => ipcRenderer.invoke('create-manual-backup'),
  deleteBackup: (backupFilename) => ipcRenderer.invoke('delete-backup', backupFilename),
  deleteAllBackups: () => ipcRenderer.invoke('delete-all-backups'),
  
  // Fullscreen toggle
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),

  // Thumbnail cleanup
  cleanupThumbnails: () => ipcRenderer.invoke('cleanup-thumbnails'),

  // Individual thumbnail loading
  getThumbnail: (imagePath) => ipcRenderer.invoke('get-thumbnail', imagePath),

  // Clear memory cache
  clearMemoryCache: () => ipcRenderer.invoke('clear-memory-cache'),

  // Menu event handling
  onMenuEvent: (eventName, callback) => {
    ipcRenderer.on(eventName, (event, ...args) => callback(...args));
  },

  // No keyboard shortcuts - button controls only
});