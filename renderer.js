class DrawingReferenceApp {
    constructor() {
        this.collections = [];
        this.currentSession = null;
        this.timer = null;
        this.currentImageIndex = 0;
        this.sessionImages = [];
        this.isPaused = false;
        this.settings = {};
        this.allTags = new Set(); // Global tag bank
        this.selectedTags = new Set(); // Currently filtered tags
        
        // Zoom and pan state (persistent during session)
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isReorderMode = false;
        this.iconSize = 'small';

        // Drag selection state
        this.isDragSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        this.selectionRect = null;

        this.initializeElements();
        this.bindEvents();
        this.bindMenuEvents();
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
        this.reorderBtn = document.getElementById('reorder-collections');
        this.selectAllBtn = document.getElementById('select-all');
        this.deselectAllBtn = document.getElementById('deselect-all');

        // Tag-related elements
        this.tagContextMenu = document.getElementById('tag-context-menu');
        this.currentTagsList = document.getElementById('current-tags-list');
        this.availableTagsList = document.getElementById('available-tags-list');
        this.newTagInput = document.getElementById('new-tag-input');
        this.addTagBtn = document.getElementById('add-tag-btn');
        this.closeTagMenuBtn = document.getElementById('close-tag-menu');
        this.tagFilters = document.getElementById('tag-filters');
        this.clearFiltersBtn = document.getElementById('clear-filters');
        this.currentContextCollectionId = null;

        // Icon size controls
        this.iconSizeButtons = document.querySelectorAll('.icon-size-btn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startSession());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.stopBtn.addEventListener('click', () => this.stopSession());
        this.addCollectionBtn.addEventListener('click', () => this.addCollection());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedCollections());
        this.reorderBtn.addEventListener('click', () => this.toggleReorderMode());
        this.selectAllBtn.addEventListener('click', () => this.selectAllCollections());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllCollections());

        // Tag management events
        this.addTagBtn.addEventListener('click', () => this.addNewTag());
        this.closeTagMenuBtn.addEventListener('click', () => this.hideTagContextMenu());
        this.clearFiltersBtn.addEventListener('click', () => this.clearTagFilters());
        this.newTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewTag();
            }
        });

        // Click outside to close context menu
        document.addEventListener('click', (e) => {
            if (!this.tagContextMenu.contains(e.target)) {
                this.hideTagContextMenu();
            }
        });

        // Icon size controls
        this.iconSizeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setIconSize(btn.getAttribute('data-size')));
        });

        // Drag selection events (from anywhere in the app)
        document.addEventListener('mousedown', (e) => this.startDragSelection(e));
        document.addEventListener('mousemove', (e) => this.updateDragSelection(e));
        document.addEventListener('mouseup', (e) => this.endDragSelection(e));
        
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

    bindMenuEvents() {
        // Listen for menu events from main process
        if (window.electronAPI && window.electronAPI.onMenuEvent) {
            window.electronAPI.onMenuEvent('menu-clear-cache', () => {
                this.clearCache();
            });

            window.electronAPI.onMenuEvent('menu-add-directory', () => {
                this.addCollection();
            });

            window.electronAPI.onMenuEvent('menu-show-message', (message) => {
                alert(message);
            });
        }
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
                // Ensure all collections have tags array (backward compatibility)
                this.collections.forEach(collection => {
                    if (!collection.tags) {
                        collection.tags = [];
                    }
                });
                this.rebuildTagBank();
                this.renderCollections();

                // Restore UI settings
                this.timerDurationInput.value = this.settings.timerDuration || 60;
                this.sessionLengthInput.value = this.settings.sessionLength || 10;
                this.iconSize = this.settings.iconSize || 'small';
                this.updateIconSizeButtons();

                // Ensure thumbnails load on initial startup
                setTimeout(() => {
                    this.loadPendingThumbnails();
                }, 100);
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
                    sessionLength: parseInt(this.sessionLengthInput.value),
                    iconSize: this.iconSize
                };
                
                await window.electronAPI.saveSettings(this.settings);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async addCollection() {
        try {
            const directoryPaths = await window.electronAPI.selectDirectory();
            if (!directoryPaths || directoryPaths.length === 0) return;

            // Handle single directory (backward compatibility)
            const paths = Array.isArray(directoryPaths) ? directoryPaths : [directoryPaths];

            if (paths.length === 1) {
                // Single directory - same as before
                await this.addSingleCollection(paths[0]);
            } else {
                // Multiple directories - show progress
                await this.addMultipleCollections(paths);
            }

        } catch (error) {
            console.error('Error adding collection(s):', error);
            alert('Error adding collection(s). Please try again.');
        }
    }

    async addSingleCollection(directoryPath) {
        const result = await window.electronAPI.getImagesFromDirectory(directoryPath);

        if (result.images.length === 0) {
            alert(`No images found in "${directoryPath.split(/[\\/]/).pop()}".`);
            return;
        }

        const dirName = directoryPath.split(/[\\/]/).pop();
        const collection = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: dirName,
            path: directoryPath,
            images: result.images,
            previews: result.previews,
            enabled: true,
            tags: [] // Initialize with empty tags array
        };

        this.collections.push(collection);
        this.renderCollections();
        this.saveSettings();
    }

    async addMultipleCollections(directoryPaths) {
        const totalPaths = directoryPaths.length;
        let processed = 0;
        let successful = 0;
        let skipped = 0;

        // Show progress indicator
        this.showProgressIndicator(`Processing ${totalPaths} directories...`);

        for (const directoryPath of directoryPaths) {
            try {
                const dirName = directoryPath.split(/[\\/]/).pop();
                this.updateProgressIndicator(`Processing "${dirName}"... (${processed + 1}/${totalPaths})`);

                const result = await window.electronAPI.getImagesFromDirectory(directoryPath);

                if (result.images.length === 0) {
                    skipped++;
                } else {
                    const collection = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: dirName,
                        path: directoryPath,
                        images: result.images,
                        previews: result.previews,
                        enabled: true,
                        tags: [] // Initialize with empty tags array
                    };

                    this.collections.push(collection);
                    successful++;
                }

                processed++;

                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Error processing ${directoryPath}:`, error);
                processed++;
                skipped++;
            }
        }

        this.hideProgressIndicator();
        this.renderCollections();
        this.saveSettings();

        // Show summary
        let message = `Added ${successful} collection(s) successfully.`;
        if (skipped > 0) {
            message += `\n${skipped} director${skipped === 1 ? 'y' : 'ies'} skipped (no images found or error).`;
        }
        alert(message);
    }

    showProgressIndicator(message) {
        // Create progress overlay if it doesn't exist
        let progressOverlay = document.getElementById('progress-overlay');
        if (!progressOverlay) {
            progressOverlay = document.createElement('div');
            progressOverlay.id = 'progress-overlay';
            progressOverlay.innerHTML = `
                <div class="progress-content">
                    <div class="progress-spinner"></div>
                    <div class="progress-message" id="progress-message"></div>
                </div>
            `;
            document.body.appendChild(progressOverlay);
        }

        document.getElementById('progress-message').textContent = message;
        progressOverlay.style.display = 'flex';
    }

    updateProgressIndicator(message) {
        const progressMessage = document.getElementById('progress-message');
        if (progressMessage) {
            progressMessage.textContent = message;
        }
    }

    hideProgressIndicator() {
        const progressOverlay = document.getElementById('progress-overlay');
        if (progressOverlay) {
            progressOverlay.style.display = 'none';
        }
    }

    setIconSize(size) {
        this.iconSize = size;
        this.updateIconSizeButtons();
        this.renderCollections();
        this.saveSettings();
    }

    updateIconSizeButtons() {
        this.iconSizeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-size') === this.iconSize);
        });

        // Apply size class to collections list
        const collectionsList = document.getElementById('collections-list');
        collectionsList.className = collectionsList.className.replace(/\s*icon-size-\w+/g, '');
        collectionsList.classList.add(`icon-size-${this.iconSize}`);
    }

    updateDeleteButton() {
        const enabledCollections = this.collections.filter(c => c.enabled);
        const hasEnabled = enabledCollections.length > 0;

        this.deleteSelectedBtn.style.display = hasEnabled ? 'block' : 'none';
        this.deleteSelectedBtn.textContent = `Delete (${enabledCollections.length})`;
    }

    deleteSelectedCollections() {
        const enabledCollections = this.collections.filter(c => c.enabled);

        if (enabledCollections.length === 0) return;

        const collectionNames = enabledCollections.map(c => c.name);

        // First confirmation
        const firstConfirmMessage = enabledCollections.length === 1
            ? `Delete the collection "${collectionNames[0]}"?`
            : `Delete ${enabledCollections.length} collections?\n\n• ${collectionNames.join('\n• ')}`;

        if (!confirm(firstConfirmMessage)) return;

        // Second confirmation for safety
        const secondConfirmMessage = enabledCollections.length === 1
            ? `Are you sure you want to permanently delete "${collectionNames[0]}"?\n\nThis action cannot be undone.`
            : `Are you sure you want to permanently delete these ${enabledCollections.length} collections?\n\nThis action cannot be undone.`;

        if (confirm(secondConfirmMessage)) {
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
            this.renderTagFilters();
            return;
        }

        // Filter collections by selected tags if any
        let filteredCollections = this.collections;
        if (this.selectedTags.size > 0) {
            filteredCollections = this.collections.filter(collection =>
                [...this.selectedTags].every(tag => collection.tags.includes(tag))
            );
        }

        this.collectionsListEl.innerHTML = filteredCollections.map(collection => {
            const firstPreview = collection.previews && collection.previews.length > 0 ? collection.previews[0] : null;
            const thumbnailHtml = firstPreview && firstPreview.thumbnailData ?
                `<img src="${firstPreview.thumbnailData}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>No preview</div>'">` :
                firstPreview ?
                `<div class="no-image placeholder">Loading...</div>` :
                '<div class="no-image">No images</div>';

            const tagsHtml = collection.tags && collection.tags.length > 0 ?
                `<div class="collection-tags">${collection.tags.map(tag => `<span class="tag-small">${tag}</span>`).join('')}</div>` :
                '<div class="collection-tags no-tags">Right-click to add tags</div>';

            if (this.iconSize === 'large') {
                // Large layout: vertical, full card clickable
                return `
                    <div class="collection-item ${collection.enabled ? 'active' : ''}"
                         onclick="app.toggleCollection('${collection.id}')"
                         oncontextmenu="app.showTagContextMenu(event, '${collection.id}')"
                         data-collection-id="${collection.id}">
                        <div class="collection-header">
                            <div class="collection-info">
                                <div class="collection-name">${collection.name}</div>
                                ${tagsHtml}
                                <div class="collection-count">${collection.images.length} images</div>
                            </div>
                        </div>
                        <div class="collection-thumbnail">
                            ${thumbnailHtml}
                        </div>
                    </div>
                `;
            } else if (this.iconSize === 'small') {
                // Small layout: no thumbnail, square-ish shape
                return `
                    <div class="collection-item ${collection.enabled ? 'active' : ''}"
                         onclick="app.toggleCollection('${collection.id}')"
                         oncontextmenu="app.showTagContextMenu(event, '${collection.id}')"
                         data-collection-id="${collection.id}">
                        <div class="collection-info">
                            <div class="collection-name">${collection.name}</div>
                            ${tagsHtml}
                            <div class="collection-count">${collection.images.length} images</div>
                        </div>
                    </div>
                `;
            } else {
                // Medium layout: horizontal with thumbnail
                return `
                    <div class="collection-item ${collection.enabled ? 'active' : ''}"
                         onclick="app.toggleCollection('${collection.id}')"
                         oncontextmenu="app.showTagContextMenu(event, '${collection.id}')"
                         data-collection-id="${collection.id}">
                        <div class="collection-header">
                            <div class="collection-info">
                                <div class="collection-name">${collection.name}</div>
                                ${tagsHtml}
                                <div class="collection-count">${collection.images.length} images</div>
                            </div>
                        </div>
                        <div class="collection-thumbnail">
                            ${thumbnailHtml}
                        </div>
                    </div>
                `;
            }
        }).join('');

        this.updateDeleteButton();
        this.updateIconSizeButtons(); // Ensure icon size class is applied
        this.renderTagFilters(); // Update tag filters after rendering

        // Load thumbnails for placeholders
        this.loadPendingThumbnails();
    }

    async loadPendingThumbnails() {
        // Find all collections with placeholder thumbnails or missing thumbnail data
        const placeholders = this.collectionsListEl.querySelectorAll('.no-image.placeholder');

        // Also look for collections that should have thumbnails but don't show them
        const allCollectionItems = this.collectionsListEl.querySelectorAll('.collection-item');
        const itemsNeedingThumbnails = [];

        allCollectionItems.forEach(item => {
            const collectionId = item.getAttribute('data-collection-id');
            const collection = this.collections.find(c => c.id === collectionId);

            if (collection && collection.previews && collection.previews.length > 0) {
                const preview = collection.previews[0];
                const thumbnailContainer = item.querySelector('.collection-thumbnail');

                // Check if thumbnail data exists but image isn't displayed
                if (preview && !preview.thumbnailData && thumbnailContainer) {
                    itemsNeedingThumbnails.push({ item, collection, preview });
                }
            }
        });

        // Process placeholders first
        for (const placeholder of placeholders) {
            await this.loadThumbnailForPlaceholder(placeholder);
        }

        // Process items that need thumbnails but aren't showing placeholders
        for (const { item, collection, preview } of itemsNeedingThumbnails) {
            await this.loadThumbnailForItem(item, collection, preview);
        }
    }

    async loadThumbnailForPlaceholder(placeholder) {
        const collectionItem = placeholder.closest('.collection-item');
        const collectionId = collectionItem.getAttribute('data-collection-id');
        const collection = this.collections.find(c => c.id === collectionId);

        if (collection && collection.previews && collection.previews.length > 0) {
            const preview = collection.previews[0];
            if (preview && !preview.thumbnailData) {
                try {
                    // Request thumbnail from main process
                    const thumbnailData = await window.electronAPI.getThumbnail(preview.path);
                    if (thumbnailData) {
                        // Update the collection data
                        preview.thumbnailData = thumbnailData;

                        // Update the DOM
                        placeholder.outerHTML = `<img src="${thumbnailData}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>No preview</div>'">`;
                    } else {
                        placeholder.textContent = 'No preview';
                        placeholder.classList.remove('placeholder');
                    }
                } catch (error) {
                    console.error('Error loading thumbnail:', error);
                    placeholder.textContent = 'No preview';
                    placeholder.classList.remove('placeholder');
                }
            }
        }
    }

    async loadThumbnailForItem(item, collection, preview) {
        try {
            // Request thumbnail from main process
            const thumbnailData = await window.electronAPI.getThumbnail(preview.path);
            if (thumbnailData) {
                // Update the collection data
                preview.thumbnailData = thumbnailData;

                // Find and update the thumbnail container
                const thumbnailContainer = item.querySelector('.collection-thumbnail');
                if (thumbnailContainer) {
                    thumbnailContainer.innerHTML = `<img src="${thumbnailData}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>No preview</div>'">`;
                }
            }
        } catch (error) {
            console.error('Error loading thumbnail for item:', error);
        }
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

        // Ensure drag selection state is cleared
        if (this.isDragSelecting) {
            this.isDragSelecting = false;
            this.removeSelectionRectangle();
        }
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
        const drawingArea = document.querySelector('.drawing-area');

        if (hasSession) {
            // Hide menu sections during session
            controlsHeader.style.display = 'none';
            collectionsSection.style.display = 'none';
            this.sessionOverlay.style.display = 'flex';
            this.deleteSelectedBtn.style.display = 'none';
            this.reorderBtn.style.display = 'none';
            drawingArea.classList.add('session-active');

            this.updateProgress();
            this.updateSessionTimer();
        } else {
            // Show menu sections when not in session
            controlsHeader.style.display = 'flex';
            collectionsSection.style.display = 'block';
            this.sessionOverlay.style.display = 'none';
            this.reorderBtn.style.display = 'block';
            drawingArea.classList.remove('session-active');
            this.updateDeleteButton(); // Fix: Ensure delete button is visible

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

    toggleReorderMode() {
        this.isReorderMode = !this.isReorderMode;

        if (this.isReorderMode) {
            this.reorderBtn.textContent = 'Save Order';
            this.reorderBtn.classList.add('active');
            this.enableDragAndDrop();
        } else {
            this.reorderBtn.textContent = 'Reorder';
            this.reorderBtn.classList.remove('active');
            this.disableDragAndDrop();
            this.saveSettings();
        }
    }

    enableDragAndDrop() {
        const collectionItems = document.querySelectorAll('.collection-item');

        collectionItems.forEach((item, index) => {
            item.draggable = true;
            item.style.cursor = 'grab';

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index.toString());
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
                item.style.cursor = 'grab';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                item.style.cursor = 'grabbing';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const targetIndex = index;

                if (draggedIndex !== targetIndex) {
                    this.reorderCollections(draggedIndex, targetIndex);
                }

                item.style.cursor = 'grab';
            });
        });
    }

    disableDragAndDrop() {
        const collectionItems = document.querySelectorAll('.collection-item');

        collectionItems.forEach(item => {
            item.draggable = false;
            item.style.cursor = 'pointer'; // Keep pointer cursor for clicking

            // Remove all drag event listeners by cloning and replacing
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });

        // Re-bind click events after cloning
        this.bindCollectionClickEvents();
    }

    bindCollectionClickEvents() {
        const collectionItems = document.querySelectorAll('.collection-item');
        collectionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const collectionId = e.target.closest('.collection-item').getAttribute('data-collection-id');
                this.toggleCollection(collectionId);
            });
        });
    }

    reorderCollections(fromIndex, toIndex) {
        // Move the collection in the array
        const [movedCollection] = this.collections.splice(fromIndex, 1);
        this.collections.splice(toIndex, 0, movedCollection);

        // Re-render collections with new order
        this.renderCollections();

        // Re-enable drag and drop if still in reorder mode
        if (this.isReorderMode) {
            this.enableDragAndDrop();
        }
    }

    startDragSelection(e) {
        // Don't start drag selection during reorder mode, sessions, or when clicking interactive elements
        if (this.isReorderMode || this.currentSession ||
            e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
            e.target.closest('.header-controls') ||
            e.target.closest('.controls-header') ||
            e.target.closest('.session-overlay') ||
            e.target.closest('.floating-buttons')) {
            return;
        }

        // Don't start drag selection if clicking on a collection item (let the click handler work)
        if (e.target.closest('.collection-item')) {
            return;
        }

        // Allow drag selection from anywhere in the app, but only show collections if they exist
        if (this.collections.length > 0) {
            this.isDragSelecting = true;

            // Use viewport coordinates for full-app dragging
            this.selectionStart = {
                x: e.clientX,
                y: e.clientY
            };

            this.createSelectionRectangle();
            e.preventDefault();
        }
    }

    updateDragSelection(e) {
        if (!this.isDragSelecting) return;

        // Use viewport coordinates for full-app dragging
        this.selectionEnd = {
            x: e.clientX,
            y: e.clientY
        };

        this.updateSelectionRectangle();
        this.updateCollectionSelection();
    }

    endDragSelection(e) {
        if (!this.isDragSelecting) return;

        this.isDragSelecting = false;
        this.removeSelectionRectangle();
        this.finalizeSelection();
    }

    createSelectionRectangle() {
        this.selectionRect = document.createElement('div');
        this.selectionRect.className = 'selection-rectangle';
        this.selectionRect.style.position = 'fixed';
        document.body.appendChild(this.selectionRect);
    }

    updateSelectionRectangle() {
        if (!this.selectionRect) return;

        const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

        // Use viewport coordinates since the rectangle is fixed positioned
        this.selectionRect.style.left = left + 'px';
        this.selectionRect.style.top = top + 'px';
        this.selectionRect.style.width = width + 'px';
        this.selectionRect.style.height = height + 'px';
        this.selectionRect.style.display = 'block';
    }

    removeSelectionRectangle() {
        if (this.selectionRect) {
            this.selectionRect.remove();
            this.selectionRect = null;
        }
    }

    updateCollectionSelection() {
        const collectionItems = this.collectionsListEl.querySelectorAll('.collection-item');
        const selectionBounds = this.getSelectionBounds();

        collectionItems.forEach(item => {
            const itemBounds = item.getBoundingClientRect();

            // Use viewport coordinates directly since selection is also in viewport coords
            const itemViewportBounds = {
                left: itemBounds.left,
                top: itemBounds.top,
                right: itemBounds.right,
                bottom: itemBounds.bottom
            };

            const isIntersecting = !(
                itemViewportBounds.right < selectionBounds.left ||
                itemViewportBounds.left > selectionBounds.right ||
                itemViewportBounds.bottom < selectionBounds.top ||
                itemViewportBounds.top > selectionBounds.bottom
            );

            item.classList.toggle('selecting', isIntersecting);
        });
    }

    getSelectionBounds() {
        return {
            left: Math.min(this.selectionStart.x, this.selectionEnd.x),
            top: Math.min(this.selectionStart.y, this.selectionEnd.y),
            right: Math.max(this.selectionStart.x, this.selectionEnd.x),
            bottom: Math.max(this.selectionStart.y, this.selectionEnd.y)
        };
    }

    finalizeSelection() {
        const selectingItems = this.collectionsListEl.querySelectorAll('.collection-item.selecting');

        selectingItems.forEach(item => {
            const collectionId = item.getAttribute('data-collection-id');
            const collection = this.collections.find(c => c.id === collectionId);
            if (collection) {
                collection.enabled = !collection.enabled;

                // Update visual state immediately and forcefully
                item.classList.remove('selecting');
                item.classList.toggle('active', collection.enabled);

                // Force a reflow to ensure the class changes take effect
                item.offsetHeight;
            } else {
                item.classList.remove('selecting');
            }
        });

        this.updateDeleteButton();
        this.saveSettings();
    }

    getFilteredCollections() {
        // Return currently filtered collections (same logic as in renderCollections)
        let filteredCollections = this.collections;
        if (this.selectedTags.size > 0) {
            filteredCollections = this.collections.filter(collection =>
                [...this.selectedTags].every(tag => collection.tags.includes(tag))
            );
        }
        return filteredCollections;
    }

    selectAllCollections() {
        const filteredCollections = this.getFilteredCollections();
        filteredCollections.forEach(collection => {
            collection.enabled = true;
        });
        this.renderCollections();
        this.saveSettings();
    }

    deselectAllCollections() {
        const filteredCollections = this.getFilteredCollections();
        filteredCollections.forEach(collection => {
            collection.enabled = false;
        });
        this.renderCollections();
        this.saveSettings();
    }

    rebuildTagBank() {
        this.allTags.clear();
        this.collections.forEach(collection => {
            if (collection.tags) {
                collection.tags.forEach(tag => this.allTags.add(tag));
            }
        });
    }

    addTagToCollection(collectionId, tag) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (collection && !collection.tags.includes(tag)) {
            collection.tags.push(tag);
            this.allTags.add(tag);
            this.renderCollections();
            this.saveSettings();
        }
    }

    removeTagFromCollection(collectionId, tag) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (collection) {
            collection.tags = collection.tags.filter(t => t !== tag);
            this.rebuildTagBank();
            this.renderCollections();
            this.saveSettings();
        }
    }

    showTagContextMenu(event, collectionId) {
        event.preventDefault();
        event.stopPropagation();

        this.currentContextCollectionId = collectionId;
        const collection = this.collections.find(c => c.id === collectionId);

        if (!collection) return;

        // Position the context menu
        const menu = this.tagContextMenu;
        menu.style.display = 'block';
        menu.style.left = Math.min(event.clientX, window.innerWidth - 320) + 'px';
        menu.style.top = Math.min(event.clientY, window.innerHeight - 300) + 'px';

        // Populate current tags
        this.currentTagsList.innerHTML = collection.tags.length > 0 ?
            collection.tags.map(tag =>
                `<span class="current-tag" onclick="app.removeTagFromCollection('${collectionId}', '${tag}')">${tag} ×</span>`
            ).join('') :
            '<span class="no-tags-text">No tags assigned</span>';

        // Populate available tags (excluding current ones)
        const availableTags = [...this.allTags].filter(tag => !collection.tags.includes(tag));
        this.availableTagsList.innerHTML = availableTags.length > 0 ?
            availableTags.map(tag =>
                `<span class="available-tag" onclick="app.addTagToCollection('${collectionId}', '${tag}')">${tag}</span>`
            ).join('') :
            '<span class="no-tags-text">No additional tags available</span>';

        // Clear new tag input
        this.newTagInput.value = '';
    }

    hideTagContextMenu() {
        this.tagContextMenu.style.display = 'none';
        this.currentContextCollectionId = null;
    }

    addNewTag() {
        const tagName = this.newTagInput.value.trim();
        if (!tagName || tagName.length === 0) return;

        // Validate tag name
        if (tagName.length > 20) {
            alert('Tag name must be 20 characters or less');
            return;
        }

        if (!/^[a-zA-Z0-9\-_\s]+$/.test(tagName)) {
            alert('Tag names can only contain letters, numbers, spaces, hyphens, and underscores');
            return;
        }

        if (this.currentContextCollectionId) {
            this.addTagToCollection(this.currentContextCollectionId, tagName);
            // Refresh the context menu
            this.showTagContextMenu({
                clientX: parseInt(this.tagContextMenu.style.left),
                clientY: parseInt(this.tagContextMenu.style.top),
                preventDefault: () => {},
                stopPropagation: () => {}
            }, this.currentContextCollectionId);
        }
    }

    renderTagFilters() {
        const tagFiltersContainer = this.tagFilters;
        const clearBtn = this.clearFiltersBtn;

        if (this.allTags.size === 0) {
            tagFiltersContainer.innerHTML = '<span class="no-tags-text">No tags available</span>';
            clearBtn.style.display = 'none';
            return;
        }

        tagFiltersContainer.innerHTML = [...this.allTags].sort().map(tag => {
            const isSelected = this.selectedTags.has(tag);
            return `<span class="filter-tag ${isSelected ? 'active' : ''}" onclick="app.toggleTagFilter('${tag}')">${tag}</span>`;
        }).join('');

        clearBtn.style.display = this.selectedTags.size > 0 ? 'block' : 'none';
    }

    toggleTagFilter(tag) {
        if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
        } else {
            this.selectedTags.add(tag);
        }
        this.renderCollections();
    }

    clearTagFilters() {
        this.selectedTags.clear();
        this.renderCollections();
    }

    async clearCache() {
        try {
            // Clear memory cache
            const clearedCount = await window.electronAPI.clearMemoryCache();

            // Clear any collection thumbnail data
            this.collections.forEach(collection => {
                if (collection.previews) {
                    collection.previews.forEach(preview => {
                        preview.thumbnailData = null;
                    });
                }
            });

            // Re-render collections to show placeholders
            this.renderCollections();

            alert(`Cache cleared! Removed ${clearedCount} thumbnails from memory. Thumbnails will regenerate as needed.`);
        } catch (error) {
            console.error('Error clearing cache:', error);
            alert('Error clearing cache. Check console for details.');
        }
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
    