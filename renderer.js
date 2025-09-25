class DrawingReferenceApp {
    constructor() {
        this.collections = [];
        this.currentSession = null;
        this.timer = null;
        this.currentImageIndex = 0;
        this.sessionImages = [];
        this.isPaused = false;
        this.settings = {};
        
        // Zoom and pan state (persistent during session)
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }

    initializeElements() {
        // Control elements
        this.timerDurationInput = document.getElementById('timer-duration');
        this.sessionLengthInput = document.getElementById('session-length');
        this.startBtn = document.getElementById('start-session');
        this.pauseBtn = document.getElementById('pause-session');
        this.stopBtn = document.getElementById('stop-session');
        this.addCollectionBtn = document.getElementById('add-collection');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        
        // Zoom controls (removed from menu)
        
        // Display elements
        this.collectionsListEl = document.getElementById('collections-list');
        this.imageContainer = document.getElementById('image-container');
        
        // Session overlay elements
        this.sessionOverlay = document.getElementById('session-overlay');
        this.countdownTimer = document.getElementById('countdown-timer');
        this.prevImageBtn = document.getElementById('prev-image');
        this.pauseResumeBtn = document.getElementById('pause-resume');
        this.nextImageBtn = document.getElementById('next-image');
        this.endSessionBtn = document.getElementById('end-session');
        this.sessionCounterEl = document.getElementById('session-counter');
        this.deleteSelectedBtn = document.getElementById('delete-selected');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startSession());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.stopBtn.addEventListener('click', () => this.stopSession());
        this.addCollectionBtn.addEventListener('click', () => this.addCollection());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedCollections());
        
        // Zoom controls (removed from menu)
        
        // Session overlay controls
        this.prevImageBtn.addEventListener('click', () => this.previousImage());
        this.pauseResumeBtn.addEventListener('click', () => this.togglePause());
        this.nextImageBtn.addEventListener('click', () => this.nextImage());
        this.endSessionBtn.addEventListener('click', () => this.stopSession());
        
        // Quick setting buttons
        document.querySelectorAll('.quick-btn[data-timer]').forEach(btn => {
            btn.addEventListener('click', () => {
                const seconds = btn.getAttribute('data-timer');
                this.timerDurationInput.value = seconds;
                this.saveSettings();
            });
        });
        
        document.querySelectorAll('.quick-btn[data-session]').forEach(btn => {
            btn.addEventListener('click', () => {
                const count = btn.getAttribute('data-session');
                this.sessionLengthInput.value = count;
                this.saveSettings();
            });
        });
        
        // No keyboard event listeners - buttons only
        
        // Mouse wheel zoom
        this.imageContainer.addEventListener('wheel', (e) => {
            if (this.currentSession && e.target.tagName === 'IMG') {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                this.adjustZoom(delta, e.clientX, e.clientY);
            }
        });
        
        // Pan with mouse drag
        this.imageContainer.addEventListener('mousedown', (e) => {
            if (this.currentSession && e.target.tagName === 'IMG') {
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                e.target.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.currentSession) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                this.panX += deltaX;
                this.panY += deltaY;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.updateImageTransform();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                const img = this.imageContainer.querySelector('img');
                if (img) {
                    img.style.cursor = this.zoom > 1 ? 'grab' : 'default';
                }
            }
        });
        
        // Double-click to reset zoom
        this.imageContainer.addEventListener('dblclick', (e) => {
            if (this.currentSession && e.target.tagName === 'IMG') {
                this.resetZoom();
            }
        });
    }

    async toggleFullscreen() {
        try {
            if (window.electronAPI) {
                const isFullScreen = await window.electronAPI.toggleFullscreen();
                this.fullscreenBtn.textContent = isFullScreen ? 'Exit Fullscreen' : 'Fullscreen';
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    }
    
    // Helper method to format file paths for Electron
    formatImagePath(filePath) {
        // Handle both string and object preview formats
        const path = typeof filePath === 'string' ? filePath : filePath.path;
        // Convert backslashes to forward slashes for web compatibility
        const normalizedPath = path.replace(/\\/g, '/');
        // For Electron, we need file:// protocol
        return `file://${normalizedPath}`;
    }

    // Zoom and Pan Methods
    zoomIn() {
        this.adjustZoom(0.2);
    }

    zoomOut() {
        this.adjustZoom(-0.2);
    }

    adjustZoom(delta, mouseX = null, mouseY = null) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom + delta));
        
        // Zoom towards mouse position if provided
        if (mouseX !== null && mouseY !== null) {
            const rect = this.imageContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const offsetX = mouseX - centerX;
            const offsetY = mouseY - centerY;
            
            const zoomRatio = this.zoom / oldZoom;
            this.panX = this.panX * zoomRatio - offsetX * (zoomRatio - 1);
            this.panY = this.panY * zoomRatio - offsetY * (zoomRatio - 1);
        }
        
        this.updateImageTransform();
        this.updateZoomLevel();
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateImageTransform();
        this.updateZoomLevel();
    }

    updateImageTransform() {
        const img = this.imageContainer.querySelector('img');
        if (img) {
            img.style.transform = `scale(${this.zoom}) translate(${this.panX / this.zoom}px, ${this.panY / this.zoom}px)`;
            img.style.cursor = this.zoom > 1 ? 'grab' : 'default';
        }
    }

    updateZoomLevel() {
        // Zoom level display removed from menu
    }

    async loadSettings() {
        try {
            if (window.electronAPI) {
                this.settings = await window.electronAPI.loadSettings();
                
                // Restore collections
                this.collections = this.settings.collections || [];
                this.renderCollections();
                
                // Restore UI settings
                this.timerDurationInput.value = this.settings.timerDuration || 60;
                this.sessionLengthInput.value = this.settings.sessionLength || 10;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            if (window.electronAPI) {
                this.settings = {
                    ...this.settings,
                    collections: this.collections,
                    timerDuration: parseInt(this.timerDurationInput.value),
                    sessionLength: parseInt(this.sessionLengthInput.value)
                };
                
                await window.electronAPI.saveSettings(this.settings);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async addCollection() {
        try {
            const directoryPath = await window.electronAPI.selectDirectory();
            if (!directoryPath) return;

            const result = await window.electronAPI.getImagesFromDirectory(directoryPath);
            
            if (result.images.length === 0) {
                alert('No images found in the selected directory.');
                return;
            }

            const dirName = directoryPath.split(/[\\/]/).pop();
            const collection = {
                id: Date.now().toString(),
                name: dirName,
                path: directoryPath,
                images: result.images,
                previews: result.previews,
                enabled: true
            };

            this.collections.push(collection);
            this.renderCollections();
            this.saveSettings();
            
        } catch (error) {
            console.error('Error adding collection:', error);
            alert('Error adding collection. Please try again.');
        }
    }

    updateDeleteButton() {
        const enabledCollections = this.collections.filter(c => c.enabled);
        const hasEnabled = enabledCollections.length > 0;
        
        this.deleteSelectedBtn.style.display = hasEnabled ? 'block' : 'none';
        this.deleteSelectedBtn.textContent = `Delete ${enabledCollections.length} Enabled Collection${enabledCollections.length !== 1 ? 's' : ''}`;
    }

    deleteSelectedCollections() {
        const enabledCollections = this.collections.filter(c => c.enabled);
        
        if (enabledCollections.length === 0) return;
        
        const collectionNames = enabledCollections.map(c => c.name);
        
        const confirmMessage = enabledCollections.length === 1 
            ? `Delete the collection "${collectionNames[0]}"?`
            : `Delete ${enabledCollections.length} collections?\n\n• ${collectionNames.join('\n• ')}`;
            
        if (confirm(confirmMessage)) {
            this.collections = this.collections.filter(c => !c.enabled);
            this.renderCollections();
            this.saveSettings();
        }
    }

    toggleCollection(collectionId) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (collection) {
            collection.enabled = !collection.enabled;
            this.renderCollections();
            this.saveSettings();
            this.updateDeleteButton();
        }
    }

    renderCollections() {
        if (this.collections.length === 0) {
            this.collectionsListEl.innerHTML = `
                <div class="no-collections">
                    <p>No image collections added yet. Click "Add Directory" to get started.</p>
                </div>
            `;
            return;
        }

        this.collectionsListEl.innerHTML = this.collections.map(collection => {
            return `
                <div class="collection-item ${collection.enabled ? 'active' : ''}">
                    <div class="collection-header">
                        <div class="collection-toggle">
                            <input type="checkbox" ${collection.enabled ? 'checked' : ''}
                                   onchange="app.toggleCollection('${collection.id}')"
                                   data-collection-id="${collection.id}">
                        </div>
                        <div class="collection-info">
                            <div class="collection-name">${collection.name}</div>
                            <div class="collection-count">${collection.images.length} images</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.updateDeleteButton();
    }

    getEnabledImages() {
        const enabledCollections = this.collections.filter(c => c.enabled);
        const allImages = [];
        
        enabledCollections.forEach(collection => {
            allImages.push(...collection.images);
        });
        
        return allImages;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    startSession() {
        const availableImages = this.getEnabledImages();
        
        if (availableImages.length === 0) {
            alert('Please add and enable at least one image collection.');
            return;
        }

        const timerDuration = parseInt(this.timerDurationInput.value);
        const sessionLength = Math.min(parseInt(this.sessionLengthInput.value), availableImages.length);
        
        // Shuffle and select images for this session
        const shuffledImages = this.shuffleArray(availableImages);
        this.sessionImages = shuffledImages.slice(0, sessionLength);
        
        this.currentSession = {
            timerDuration: timerDuration,
            sessionLength: sessionLength,
            startTime: Date.now(),
            timeRemaining: timerDuration
        };
        
        this.currentImageIndex = 0;
        this.isPaused = false;
        
        this.updateUI();
        this.displayCurrentImage();
        this.startTimer();
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (!this.isPaused && this.currentSession) {
                this.currentSession.timeRemaining--;
                this.updateTimerDisplay();
                this.updateSessionTimer();
                
                if (this.currentSession.timeRemaining <= 0) {
                    this.nextImage();
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    nextImage() {
        if (!this.currentSession) return;
        
        this.currentImageIndex++;
        
        if (this.currentImageIndex >= this.sessionImages.length) {
            this.endSession();
            return;
        }
        
        this.currentSession.timeRemaining = this.currentSession.timerDuration;
        this.displayCurrentImage();
        this.updateProgress();
    }

    previousImage() {
        if (!this.currentSession || this.currentImageIndex <= 0) return;
        
        this.currentImageIndex--;
        this.currentSession.timeRemaining = this.currentSession.timerDuration;
        this.displayCurrentImage();
        this.updateProgress();
    }

    togglePause() {
        if (!this.currentSession) return;
        
        this.isPaused = !this.isPaused;
        this.pauseResumeBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        this.pauseResumeBtn.classList.toggle('primary', !this.isPaused);
    }

    stopSession() {
        this.currentSession = null;
        this.stopTimer();
        this.currentImageIndex = 0;
        this.sessionImages = [];
        this.isPaused = false;
        
        this.updateUI();
        this.showPlaceholder();
    }

    endSession() {
        this.stopSession();
    }

    displayCurrentImage() {
        if (!this.currentSession || !this.sessionImages[this.currentImageIndex]) return;
        
        const currentImage = this.sessionImages[this.currentImageIndex];
        
        // Add transition class
        this.imageContainer.classList.add('transitioning');
        
        setTimeout(() => {
            const imageUrl = this.formatImagePath(currentImage.path);
            this.imageContainer.innerHTML = `
                <img src="${imageUrl}" alt="${currentImage.name}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display:none; color: #ff4757;">
                    <p>Error loading image:</p>
                    <p>${currentImage.name}</p>
                </div>
            `;
            
            // Remove transition class and apply zoom/pan state
            this.imageContainer.classList.remove('transitioning');
            setTimeout(() => {
                this.updateImageTransform();
            }, 50);
        }, 150);
    }

    showPlaceholder() {
        // No placeholder needed - collections section now takes full space
        this.imageContainer.innerHTML = '';
    }

    updateUI() {
        const hasSession = !!this.currentSession;

        // Hide/show sections based on session state
        const controlsHeader = document.querySelector('.controls-header');
        const collectionsSection = document.querySelector('.collections-section');

        if (hasSession) {
            // Hide menu sections during session
            controlsHeader.style.display = 'none';
            collectionsSection.style.display = 'none';
            this.sessionOverlay.style.display = 'flex';

            this.updateProgress();
            this.updateSessionTimer();
        } else {
            // Show menu sections when not in session
            controlsHeader.style.display = 'flex';
            collectionsSection.style.display = 'block';
            this.sessionOverlay.style.display = 'none';

            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopBtn.disabled = true;
            this.timerDurationInput.disabled = false;
            this.sessionLengthInput.disabled = false;

            // Save settings when timer/session values change
            this.timerDurationInput.onchange = () => this.saveSettings();
            this.sessionLengthInput.onchange = () => this.saveSettings();

            this.pauseBtn.textContent = 'Pause';
            this.pauseBtn.classList.remove('primary-btn');
            this.pauseBtn.classList.add('secondary-btn');
        }
    }

    updateSessionTimer() {
        if (!this.currentSession) return;
        
        const minutes = Math.floor(this.currentSession.timeRemaining / 60);
        const seconds = this.currentSession.timeRemaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.countdownTimer.textContent = timeString;
        
        // Add visual warnings
        this.countdownTimer.classList.remove('warning', 'danger');
        if (this.currentSession.timeRemaining <= 10) {
            this.countdownTimer.classList.add('danger');
        } else if (this.currentSession.timeRemaining <= 30) {
            this.countdownTimer.classList.add('warning');
        }
    }

    updateTimerDisplay() {
        // Timer display removed from menu - only overlay timer is used
    }

    updateProgress() {
        if (!this.currentSession) return;

        const current = this.currentImageIndex + 1;
        const total = this.sessionImages.length;

        this.sessionCounterEl.textContent = `${current} / ${total}`;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DrawingReferenceApp();
});

// Handle app focus/blur for better keyboard handling
window.addEventListener('focus', () => {
    // Re-enable keyboard shortcuts when app gains focus
    if (window.app && window.app.currentSession) {
        console.log('App focused - keyboard shortcuts active');
    }
});

window.addEventListener('blur', () => {
    // App lost focus
    console.log('App lost focus');
});
    