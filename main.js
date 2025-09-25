const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

// Settings file path - save in app directory
const settingsPath = path.join(__dirname, 'settings.json');

// Default settings
const defaultSettings = {
  collections: [],
  timerDuration: 60,
  sessionLength: 10,
  windowBounds: { width: 1200, height: 800 }
};

// Load settings from file
async function loadSettings() {
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);
    return { ...defaultSettings, ...settings };
  } catch (error) {
    // File doesn't exist or is invalid, return defaults
    return defaultSettings;
  }
}

// Save settings to file
async function saveSettings(settings) {
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

async function createWindow() {
  const settings = await loadSettings();
  
  mainWindow = new BrowserWindow({
    width: settings.windowBounds.width,
    height: settings.windowBounds.height,
    x: settings.windowBounds.x,
    y: settings.windowBounds.y,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add your icon
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('index.html');

  // Save window bounds when moved or resized
  mainWindow.on('moved', saveWindowBounds);
  mainWindow.on('resized', saveWindowBounds);

  // Optional: Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

async function saveWindowBounds() {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    const settings = await loadSettings();
    settings.windowBounds = bounds;
    await saveSettings(settings);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Image Directory'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Recursively scan directory for images
async function scanDirectoryRecursively(dirPath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const imageFiles = [];
  
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        // Recursively scan subdirectories
        const subImages = await scanDirectoryRecursively(fullPath);
        imageFiles.push(...subImages);
      } else if (file.isFile()) {
        // Check if it's an image file
        const ext = path.extname(file.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageFiles.push({
            name: file.name,
            path: fullPath,
            relativePath: path.relative(dirPath, fullPath)
          });
        }
      }
    }
    
    return imageFiles;
  } catch (error) {
    console.error('Error scanning directory:', dirPath, error);
    return [];
  }
}

// Get images from directory (now with recursive scanning)
ipcMain.handle('get-images-from-directory', async (event, directoryPath) => {
  try {
    const imageFiles = await scanDirectoryRecursively(directoryPath);
    
    // Select up to 3 random images for preview
    const shuffled = [...imageFiles].sort(() => 0.5 - Math.random());
    const previewImages = shuffled.slice(0, 3).map(img => ({
      path: img.path,
      name: img.name
    }));
    
    return {
      images: imageFiles,
      previews: previewImages
    };
  } catch (error) {
    console.error('Error reading directory:', error);
    return {
      images: [],
      previews: []
    };
  }
});

// No global keyboard shortcuts - button controls only

// Settings management IPC handlers
ipcMain.handle('load-settings', async () => {
  return await loadSettings();
});

ipcMain.handle('save-settings', async (event, settings) => {
  await saveSettings(settings);
});

// Fullscreen toggle handler
ipcMain.handle('toggle-fullscreen', async () => {
  if (mainWindow) {
    const isFullScreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullScreen);
    return !isFullScreen;
  }
  return false;
});