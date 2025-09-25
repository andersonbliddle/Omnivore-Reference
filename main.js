const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto');

let mainWindow;

// Settings file path - save in app directory
const settingsPath = path.join(__dirname, 'settings.json');

// Thumbnail cache directory
const thumbnailCacheDir = path.join(__dirname, 'thumbnail_cache');

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

// Ensure thumbnail cache directory exists
async function ensureThumbnailCacheDir() {
  try {
    await fs.access(thumbnailCacheDir);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(thumbnailCacheDir, { recursive: true });
  }
}

// Thumbnail version - increment this when changing thumbnail parameters
const THUMBNAIL_VERSION = 'v4_200x150_50q';

// Generate a hash for the image file to use as thumbnail filename
function generateThumbnailHash(imagePath, modifiedTime) {
  const hash = crypto.createHash('md5');
  hash.update(imagePath + modifiedTime + THUMBNAIL_VERSION);
  return hash.digest('hex') + '.webp';
}

// In-memory cache for base64 thumbnails
const thumbnailCache = new Map();

// Generate thumbnail for an image
async function generateThumbnail(imagePath, thumbnailPath, maxWidth = 200, maxHeight = 150) {
  try {
    await sharp(imagePath)
      .resize(maxWidth, maxHeight, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false
      })
      .webp({ quality: 50 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail for', imagePath, error);
    return null;
  }
}

// Generate base64 thumbnail from file
async function generateBase64Thumbnail(imagePath, maxWidth = 200, maxHeight = 150) {
  try {
    const buffer = await sharp(imagePath)
      .resize(maxWidth, maxHeight, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false
      })
      .webp({ quality: 50 })
      .toBuffer();

    return `data:image/webp;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error generating base64 thumbnail for', imagePath, error);
    return null;
  }
}

// Get or create thumbnail for an image (returns base64 data URL)
async function getThumbnail(imagePath) {
  try {
    // Get file stats for modification time
    const stats = await fs.stat(imagePath);
    const modifiedTime = stats.mtime.getTime();

    const cacheKey = `${imagePath}:${modifiedTime}:${THUMBNAIL_VERSION}`;

    // Check memory cache first
    if (thumbnailCache.has(cacheKey)) {
      return thumbnailCache.get(cacheKey);
    }

    // Generate thumbnail filename based on path and modification time
    const thumbnailFileName = generateThumbnailHash(imagePath, modifiedTime);
    const thumbnailPath = path.join(thumbnailCacheDir, thumbnailFileName);

    let base64Thumbnail = null;

    // Check if thumbnail already exists on disk and is newer than the original
    try {
      const thumbnailStats = await fs.stat(thumbnailPath);
      if (thumbnailStats.mtime.getTime() >= modifiedTime) {
        // Thumbnail exists, convert to base64
        const thumbnailBuffer = await fs.readFile(thumbnailPath);
        base64Thumbnail = `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`;
      }
    } catch (error) {
      // Thumbnail doesn't exist, will create new one
    }

    // If no cached thumbnail, generate new one
    if (!base64Thumbnail) {
      // Generate thumbnail file and base64 in parallel
      const [thumbnailFilePath, base64Result] = await Promise.all([
        generateThumbnail(imagePath, thumbnailPath),
        generateBase64Thumbnail(imagePath)
      ]);

      base64Thumbnail = base64Result;
    }

    // Cache in memory if successful
    if (base64Thumbnail) {
      thumbnailCache.set(cacheKey, base64Thumbnail);

      // Limit cache size (keep last 500 thumbnails)
      if (thumbnailCache.size > 500) {
        const firstKey = thumbnailCache.keys().next().value;
        thumbnailCache.delete(firstKey);
      }
    }

    return base64Thumbnail;
  } catch (error) {
    console.error('Error processing thumbnail for', imagePath, error);
    return null;
  }
}

async function createWindow() {
  // Ensure thumbnail cache directory exists
  await ensureThumbnailCacheDir();

  // Clean up old thumbnails on startup
  cleanupThumbnails();

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

// Handle directory selection (supports multi-select)
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections'],
    title: 'Select Image Directories (Hold Ctrl/Cmd for multiple)'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths; // Return array of selected paths
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

// Get images from directory (now with recursive scanning and background thumbnail generation)
ipcMain.handle('get-images-from-directory', async (event, directoryPath) => {
  try {
    const imageFiles = await scanDirectoryRecursively(directoryPath);

    // Select just 1 image for preview (faster than 3)
    const shuffled = [...imageFiles].sort(() => 0.5 - Math.random());
    const previewCandidate = shuffled[0];

    // Generate thumbnail for preview image (non-blocking)
    const previewImages = [];
    if (previewCandidate) {
      // Try to get thumbnail quickly, but don't block if it fails
      try {
        const thumbnailData = await Promise.race([
          getThumbnail(previewCandidate.path),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
        ]);

        if (thumbnailData) {
          previewImages.push({
            path: previewCandidate.path,
            name: previewCandidate.name,
            thumbnailData: thumbnailData
          });
        }
      } catch (error) {
        // If thumbnail generation takes too long or fails, use placeholder
        previewImages.push({
          path: previewCandidate.path,
          name: previewCandidate.name,
          thumbnailData: null
        });
      }

      // Generate thumbnails for remaining images in background (non-blocking)
      setImmediate(async () => {
        const remainingImages = shuffled.slice(1, 10); // Process up to 10 more images
        for (const img of remainingImages) {
          try {
            await getThumbnail(img.path);
          } catch (error) {
            // Ignore errors in background processing
          }
        }
      });
    }

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

// Clean up old thumbnails that are no longer referenced
async function cleanupThumbnails() {
  try {
    const thumbnailFiles = await fs.readdir(thumbnailCacheDir);
    let cleanedCount = 0;

    // Get current time
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    for (const file of thumbnailFiles) {
      if (file.endsWith('.webp')) {
        const filePath = path.join(thumbnailCacheDir, file);
        try {
          const stats = await fs.stat(filePath);
          // Remove thumbnails older than 30 days that haven't been accessed recently
          if (now - stats.atime.getTime() > maxAge) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // File might have been deleted already
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old thumbnails`);
    }
  } catch (error) {
    console.error('Error cleaning up thumbnails:', error);
  }
}

// Add cleanup handler
ipcMain.handle('cleanup-thumbnails', cleanupThumbnails);

// Handle individual thumbnail requests
ipcMain.handle('get-thumbnail', async (event, imagePath) => {
  try {
    const thumbnailData = await getThumbnail(imagePath);
    return thumbnailData;
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    return null;
  }
});