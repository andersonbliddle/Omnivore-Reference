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
        this.selectedTags = new Set(); // Currently filtered tags (included)
        this.excludedTags = new Set(); // Currently excluded tags
        this.textFilter = ''; // Current text filter
        this.practiceSets = {}; // Practice sets storage: {name: {collections: [ids], createdAt: timestamp}}
        this.currentPracticeSet = null; // Currently selected practice set name
        
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
        this.dragStartedOnCollection = false;
        this.dragStartTime = 0;

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
        this.selectAllTrueBtn = document.getElementById('select-all-true');
        this.deselectAllTrueBtn = document.getElementById('deselect-all-true');
        this.selectFilteredBtn = document.getElementById('select-filtered');
        this.deselectFilteredBtn = document.getElementById('deselect-filtered');

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

        // Text filter elements
        this.textFilterInput = document.getElementById('text-filter-input');
        this.clearTextFilterBtn = document.getElementById('clear-text-filter');

        // Mass tag management elements
        this.addTagToSelectedBtn = document.getElementById('add-tag-to-selected');
        this.removeTagFromSelectedBtn = document.getElementById('remove-tag-from-selected');
        this.massTagAddDialog = document.getElementById('mass-tag-add-dialog');
        this.massTagRemoveDialog = document.getElementById('mass-tag-remove-dialog');
        this.massAddTagInput = document.getElementById('mass-add-tag-input');
        this.createAndAddTagBtn = document.getElementById('create-and-add-tag');
        this.massAddExistingTags = document.getElementById('mass-add-existing-tags');
        this.massRemoveTagsList = document.getElementById('mass-remove-tags-list');
        this.cancelMassAddBtn = document.getElementById('cancel-mass-add');
        this.cancelMassRemoveBtn = document.getElementById('cancel-mass-remove');

        // Icon size controls
        this.iconSizeButtons = document.querySelectorAll('.icon-size-btn');

        // Practice sets elements
        this.practiceSetsDropdown = document.getElementById('practice-sets-dropdown');
        this.savePracticeSetBtn = document.getElementById('save-practice-set');
        this.updatePracticeSetBtn = document.getElementById('update-practice-set');
        this.deletePracticeSetBtn = document.getElementById('delete-practice-set');
        this.savePracticeSetDialog = document.getElementById('save-practice-set-dialog');
        this.practiceSetNameInput = document.getElementById('practice-set-name-input');
        this.confirmSavePracticeSetBtn = document.getElementById('confirm-save-practice-set');
        this.cancelSavePracticeSetBtn = document.getElementById('cancel-save-practice-set');
        this.practiceSetSelectedCount = document.getElementById('practice-set-selected-count');

        // Debug: Check if practice set elements were found
        console.log('Practice sets elements initialization:', {
            dropdown: !!this.practiceSetsDropdown,
            saveBtn: !!this.savePracticeSetBtn,
            updateBtn: !!this.updatePracticeSetBtn,
            deleteBtn: !!this.deletePracticeSetBtn,
            dialog: !!this.savePracticeSetDialog,
            nameInput: !!this.practiceSetNameInput,
            confirmBtn: !!this.confirmSavePracticeSetBtn,
            cancelBtn: !!this.cancelSavePracticeSetBtn,
            selectedCount: !!this.practiceSetSelectedCount
        });
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startSession());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.stopBtn.addEventListener('click', () => this.stopSession());
        this.addCollectionBtn.addEventListener('click', () => this.addCollection());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedCollections());
        this.reorderBtn.addEventListener('click', () => this.toggleReorderMode());
        this.selectAllTrueBtn.addEventListener('click', () => this.selectAllCollectionsTrue());
        this.deselectAllTrueBtn.addEventListener('click', () => this.deselectAllCollectionsTrue());
        this.selectFilteredBtn.addEventListener('click', () => this.selectFilteredCollections());
        this.deselectFilteredBtn.addEventListener('click', () => this.deselectFilteredCollections());

        // Mass tag management events
        this.addTagToSelectedBtn.addEventListener('click', () => this.showMassAddTagDialog());
        this.removeTagFromSelectedBtn.addEventListener('click', () => this.showMassRemoveTagDialog());
        this.createAndAddTagBtn.addEventListener('click', async () => await this.createAndAddTag());
        this.cancelMassAddBtn.addEventListener('click', () => this.hideMassAddTagDialog());
        this.cancelMassRemoveBtn.addEventListener('click', () => this.hideMassRemoveTagDialog());
        // Create a reusable handler for the mass add tag input
        this.massTagInputHandler = async (e) => {
            if (e.key === 'Enter') {
                await this.createAndAddTag();
            }
        };
        this.ensureMassTagInputEventListener();

        // Tag management events
        this.addTagBtn.addEventListener('click', async () => await this.addNewTag());
        this.closeTagMenuBtn.addEventListener('click', () => this.hideTagContextMenu());
        this.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());

        // Text filter events
        this.textFilterInput.addEventListener('input', (e) => this.updateTextFilter(e.target.value));
        this.textFilterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearTextFilter();
            }
        });
        this.clearTextFilterBtn.addEventListener('click', () => this.clearTextFilter());
        // Create a reusable handler for the tag input
        this.tagInputHandler = async (e) => {
            if (e.key === 'Enter') {
                await this.addNewTag();
            }
        };
        this.newTagInput.addEventListener('keypress', this.tagInputHandler);

        // Click outside to close context menu
        document.addEventListener('click', (e) => {
            if (!this.tagContextMenu.contains(e.target)) {
                this.hideTagContextMenu();
            }
        });

        // Click outside to close mass tag dialogs
        document.addEventListener('click', (e) => {
            if (this.massTagAddDialog.style.display === 'flex' &&
                !e.target.closest('.dialog-content') &&
                !e.target.closest('#add-tag-to-selected')) {
                this.hideMassAddTagDialog();
            }
            if (this.massTagRemoveDialog.style.display === 'flex' &&
                !e.target.closest('.dialog-content') &&
                !e.target.closest('#remove-tag-from-selected')) {
                this.hideMassRemoveTagDialog();
            }
        });

        // Icon size controls
        this.iconSizeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setIconSize(btn.getAttribute('data-size')));
        });

        // Practice sets events
        if (this.practiceSetsDropdown) {
            this.practiceSetsDropdown.addEventListener('change', (e) => {
                console.log('Practice sets dropdown changed to:', e.target.value);
                this.loadPracticeSet(e.target.value);
            });

            // Add debug event listeners to detect interaction issues
            this.practiceSetsDropdown.addEventListener('mousedown', (e) => {
                console.log('Practice sets dropdown mousedown event');
            });

            this.practiceSetsDropdown.addEventListener('click', (e) => {
                console.log('Practice sets dropdown click event');
            });

            this.practiceSetsDropdown.addEventListener('focus', (e) => {
                console.log('Practice sets dropdown focus event');
            });

            console.log('Practice sets dropdown event listeners added');
        } else {
            console.error('Practice sets dropdown element not found during event binding!');
        }
        this.savePracticeSetBtn.addEventListener('click', () => this.showSavePracticeSetDialog());
        this.updatePracticeSetBtn.addEventListener('click', () => this.updateCurrentPracticeSet());
        this.deletePracticeSetBtn.addEventListener('click', () => this.deleteCurrentPracticeSet());
        this.confirmSavePracticeSetBtn.addEventListener('click', () => this.savePracticeSet());
        this.cancelSavePracticeSetBtn.addEventListener('click', () => this.hideSavePracticeSetDialog());
        this.practiceSetNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.savePracticeSet();
            }
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

            window.electronAPI.onMenuEvent('menu-show-message', async (message) => {
                await this.showAlert(message);
            });

            window.electronAPI.onMenuEvent('menu-show-backup-dialog', () => {
                this.showBackupDialog();
            });

            window.electronAPI.onMenuEvent('menu-show-delete-backup-dialog', () => {
                this.showDeleteBackupDialog();
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

                // Restore UI settings first
                this.timerDurationInput.value = this.settings.timerDuration || 60;
                this.sessionLengthInput.value = this.settings.sessionLength || 10;
                this.iconSize = this.settings.iconSize || 'small';
                this.updateIconSizeButtons();

                // Restore collections after icon size is applied
                this.collections = this.settings.collections || [];
                // Ensure all collections have tags array (backward compatibility)
                this.collections.forEach(collection => {
                    if (!collection.tags) {
                        collection.tags = [];
                    }
                });
                this.rebuildTagBank();

                // Restore practice sets
                this.practiceSets = this.settings.practiceSets || {};
                this.renderPracticeSetsDropdown();

                this.renderCollections();
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
                    iconSize: this.iconSize,
                    practiceSets: this.practiceSets
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
            await this.showAlert('Error adding collection(s). Please try again.');
        }
    }

    async addSingleCollection(directoryPath) {
        const result = await window.electronAPI.getImagesFromDirectory(directoryPath);

        if (result.images.length === 0) {
            await this.showAlert(`No images found in "${directoryPath.split(/[\\/]/).pop()}".`);
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
        await this.showAlert(message);
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

        // Show/hide mass tag buttons
        this.addTagToSelectedBtn.style.display = hasEnabled ? 'block' : 'none';
        this.removeTagFromSelectedBtn.style.display = hasEnabled ? 'block' : 'none';

        // Update practice set buttons
        this.updatePracticeSetButtons();
    }

    async deleteSelectedCollections() {
        const enabledCollections = this.collections.filter(c => c.enabled);

        if (enabledCollections.length === 0) return;

        const collectionNames = enabledCollections.map(c => c.name);

        // First confirmation
        const firstConfirmMessage = enabledCollections.length === 1
            ? `Delete the collection "${collectionNames[0]}"?`
            : `Delete ${enabledCollections.length} collections?\n\n• ${collectionNames.join('\n• ')}`;

        if (!(await this.showConfirm(firstConfirmMessage))) return;

        // Second confirmation for safety
        const secondConfirmMessage = enabledCollections.length === 1
            ? `Are you sure you want to permanently delete "${collectionNames[0]}"?\n\nThis action cannot be undone.`
            : `Are you sure you want to permanently delete these ${enabledCollections.length} collections?\n\nThis action cannot be undone.`;

        if (await this.showConfirm(secondConfirmMessage)) {
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

        // Filter collections using the shared filtering logic
        const filteredCollections = this.getFilteredCollections();

        this.collectionsListEl.innerHTML = filteredCollections.map(collection => {
            const firstPreview = collection.previews && collection.previews.length > 0 ? collection.previews[0] : null;

            let thumbnailHtml;
            if (firstPreview) {
                if (firstPreview.thumbnailData) {
                    // Have thumbnail data, show image
                    thumbnailHtml = `<img src="${firstPreview.thumbnailData}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>No preview</div>'">`;
                } else {
                    // Have preview but no thumbnail data yet, show loading placeholder
                    thumbnailHtml = `<div class="no-image placeholder">Loading...</div>`;
                }
            } else {
                // No preview available
                thumbnailHtml = '<div class="no-image">No images</div>';
            }

            const tagsHtml = collection.tags && collection.tags.length > 0 ?
                `<div class="collection-tags">${collection.tags.map(tag => `<span class="tag-small">${tag}</span>`).join('')}</div>` :
                '<div class="collection-tags no-tags">Right-click to add tags</div>';

            if (this.iconSize === 'large') {
                // Large layout: vertical, full card clickable
                return `
                    <div class="collection-item ${collection.enabled ? 'active' : ''}"
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
        // Find all collections with placeholder thumbnails
        const placeholders = this.collectionsListEl.querySelectorAll('.no-image.placeholder');

        // Process all placeholders concurrently for faster loading
        const loadPromises = Array.from(placeholders).map(placeholder =>
            this.loadThumbnailForPlaceholder(placeholder)
        );

        // Load thumbnails concurrently instead of sequentially
        await Promise.all(loadPromises);
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

    async startSession() {
        const availableImages = this.getEnabledImages();
        
        if (availableImages.length === 0) {
            await this.showAlert('Please add and enable at least one image collection.');
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
        // Only prevent drag selection for very specific interactive elements
        if (this.isReorderMode || this.currentSession ||
            e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' ||
            e.target.tagName === 'OPTION' ||
            e.target.closest('.practice-sets-controls') ||
            e.target.closest('.timer-controls') ||
            e.target.closest('.tag-context-menu') ||
            e.target.closest('.mass-tag-dialog') ||
            e.target.closest('.custom-modal')) {
            return;
        }

        // Start drag selection from anywhere, including collection items
        if (this.collections.length > 0) {
            this.isDragSelecting = true;
            this.dragStartedOnCollection = !!e.target.closest('.collection-item');
            this.dragStartTime = Date.now();

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

        const dragDistance = Math.sqrt(
            Math.pow(e.clientX - this.selectionStart.x, 2) +
            Math.pow(e.clientY - this.selectionStart.y, 2)
        );
        const dragDuration = Date.now() - this.dragStartTime;

        // If drag started on a collection and was a short drag (< 5 pixels, < 200ms), treat as click
        if (this.dragStartedOnCollection && dragDistance < 5 && dragDuration < 200) {
            this.isDragSelecting = false;
            this.removeSelectionRectangle();

            // Trigger the collection click
            const collectionItem = e.target.closest('.collection-item');
            if (collectionItem) {
                const collectionId = collectionItem.getAttribute('data-collection-id');
                this.toggleCollection(collectionId);
            }
            return;
        }

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

        // Apply text filter first
        if (this.textFilter && this.textFilter.trim().length > 0) {
            const filterText = this.textFilter.toLowerCase();
            filteredCollections = filteredCollections.filter(collection =>
                collection.name.toLowerCase().includes(filterText)
            );
        }

        // Apply inclusion filter (all selected tags must be present)
        if (this.selectedTags.size > 0) {
            filteredCollections = filteredCollections.filter(collection =>
                [...this.selectedTags].every(tag => collection.tags.includes(tag))
            );
        }

        // Apply exclusion filter (excluded tags must not be present)
        if (this.excludedTags.size > 0) {
            filteredCollections = filteredCollections.filter(collection =>
                ![...this.excludedTags].some(tag => collection.tags.includes(tag))
            );
        }

        return filteredCollections;
    }

    selectAllCollectionsTrue() {
        // Select ALL collections regardless of filtering
        this.collections.forEach(collection => {
            collection.enabled = true;
        });
        this.renderCollections();
        this.saveSettings();
    }

    deselectAllCollectionsTrue() {
        // Deselect ALL collections regardless of filtering
        this.collections.forEach(collection => {
            collection.enabled = false;
        });
        this.renderCollections();
        this.saveSettings();
    }

    selectFilteredCollections() {
        // Select only the currently filtered collections
        const filteredCollections = this.getFilteredCollections();
        filteredCollections.forEach(collection => {
            collection.enabled = true;
        });
        this.renderCollections();
        this.saveSettings();
    }

    deselectFilteredCollections() {
        // Deselect only the currently filtered collections
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

            // Refresh the context menu if it's open for this collection
            if (this.currentContextCollectionId === collectionId && this.tagContextMenu.style.display === 'block') {
                this.refreshTagContextMenu();
            }
        }
    }

    removeTagFromCollection(collectionId, tag) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (collection) {
            collection.tags = collection.tags.filter(t => t !== tag);
            this.rebuildTagBank();
            this.renderCollections();
            this.saveSettings();

            // Refresh the context menu if it's open for this collection
            if (this.currentContextCollectionId === collectionId && this.tagContextMenu.style.display === 'block') {
                this.refreshTagContextMenu();
            }
        }
    }

    showTagContextMenu(event, collectionId) {
        event.preventDefault();
        event.stopPropagation();

        // Clear any lingering focus states from popups
        this.clearFocusState();

        this.currentContextCollectionId = collectionId;
        const collection = this.collections.find(c => c.id === collectionId);

        if (!collection) return;

        // Position the context menu
        const menu = this.tagContextMenu;
        menu.style.display = 'block';
        menu.style.left = Math.min(event.clientX, window.innerWidth - 320) + 'px';
        menu.style.top = Math.min(event.clientY, window.innerHeight - 300) + 'px';

        // Ensure window and element are properly focusable after showing menu
        setTimeout(() => {
            window.focus();
            // Make sure input elements in the tooltip are interactive
            const newTagInput = document.getElementById('new-tag-input');
            if (newTagInput) {
                // Remove any focus-blocking attributes and ensure it's interactive
                newTagInput.removeAttribute('disabled');
                newTagInput.style.pointerEvents = 'auto';
            }
        }, 10);

        // Show all tags in a single pool with selected/unselected styling
        const allTagsArray = [...this.allTags].sort();
        this.currentTagsList.innerHTML = allTagsArray.length > 0 ?
            allTagsArray.map(tag => {
                const isSelected = collection.tags.includes(tag);
                const tagClass = isSelected ? 'current-tag selected' : 'current-tag unselected';
                return `<span class="${tagClass}" onclick="event.stopPropagation(); app.toggleTagForCollection('${collectionId}', '${tag}')">${tag}</span>`;
            }).join('') :
            '<span class="no-tags-text">No tags available</span>';

        // Hide the available tags section since we're using a single pool
        this.availableTagsList.innerHTML = '';

        // Clear new tag input
        const newTagInput = document.getElementById('new-tag-input');
        if (newTagInput) {
            newTagInput.value = '';
        }
    }

    hideTagContextMenu() {
        this.tagContextMenu.style.display = 'none';
        this.currentContextCollectionId = null;
    }

    toggleTagForCollection(collectionId, tag) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return;

        if (collection.tags.includes(tag)) {
            // Remove tag
            collection.tags = collection.tags.filter(t => t !== tag);
        } else {
            // Add tag
            collection.tags.push(tag);
            this.allTags.add(tag);
        }

        this.rebuildTagBank();
        this.renderCollections();
        this.saveSettings();

        // Refresh the context menu if it's open for this collection
        if (this.currentContextCollectionId === collectionId && this.tagContextMenu.style.display === 'block') {
            this.refreshTagContextMenu();
        }
    }

    refreshTagContextMenu() {
        if (!this.currentContextCollectionId) return;

        const collection = this.collections.find(c => c.id === this.currentContextCollectionId);
        if (!collection) return;

        // Store the current input value before refreshing
        const currentInputValue = this.newTagInput ? this.newTagInput.value : '';

        // Show all tags in a single pool with selected/unselected styling
        const allTagsArray = [...this.allTags].sort();
        this.currentTagsList.innerHTML = allTagsArray.length > 0 ?
            allTagsArray.map(tag => {
                const isSelected = collection.tags.includes(tag);
                const tagClass = isSelected ? 'current-tag selected' : 'current-tag unselected';
                return `<span class="${tagClass}" onclick="event.stopPropagation(); app.toggleTagForCollection('${this.currentContextCollectionId}', '${tag}')">${tag}</span>`;
            }).join('') :
            '<span class="no-tags-text">No tags available</span>';

        // Hide the available tags section since we're using a single pool
        this.availableTagsList.innerHTML = '';

        // Re-get the input element reference after innerHTML changes and restore its value
        this.newTagInput = document.getElementById('new-tag-input');
        if (this.newTagInput) {
            this.newTagInput.value = currentInputValue;
        }

        // Ensure the input element has its event listener after DOM changes
        this.ensureTagInputEventListener();
    }

    reinitializeTagElements() {
        // Re-get all tag-related element references (both tooltip and mass tag inputs)
        this.newTagInput = document.getElementById('new-tag-input');
        this.massAddTagInput = document.getElementById('mass-add-tag-input');
        this.addTagBtn = document.getElementById('add-tag-btn');
        this.tagContextMenu = document.getElementById('tag-context-menu');
        this.currentTagsList = document.getElementById('current-tags-list');

        // Re-bind both input event listeners to ensure they work after DOM changes
        this.ensureTagInputEventListener();
        this.ensureMassTagInputEventListener();

        console.log('Reinitialized tag elements:', {
            newTagInput: !!this.newTagInput,
            massAddTagInput: !!this.massAddTagInput,
            addTagBtn: !!this.addTagBtn,
            tagContextMenu: !!this.tagContextMenu
        });
    }

    ensureMassTagInputEventListener() {
        // Always get fresh element reference and update stored reference
        this.massAddTagInput = document.getElementById('mass-add-tag-input');

        if (this.massAddTagInput) {
            // Remove existing listener first to avoid duplicates (safe to call even if not attached)
            this.massAddTagInput.removeEventListener('keypress', this.massTagInputHandler);

            // Ensure we have the handler function
            if (!this.massTagInputHandler) {
                this.massTagInputHandler = (e) => {
                    if (e.key === 'Enter') {
                        this.createAndAddTag();
                    }
                };
            }

            // Re-add the listener to the fresh element
            this.massAddTagInput.addEventListener('keypress', this.massTagInputHandler);
            console.log('Mass tag input event listener re-bound successfully');
        } else {
            console.warn('massAddTagInput element not found - dialog may be closed');
        }
    }

    ensureTagInputEventListener() {
        // Always get fresh element reference and update stored reference
        this.newTagInput = document.getElementById('new-tag-input');

        if (this.newTagInput) {
            // Remove existing listener first to avoid duplicates (safe to call even if not attached)
            this.newTagInput.removeEventListener('keypress', this.tagInputHandler);

            // Ensure we have the handler function
            if (!this.tagInputHandler) {
                this.tagInputHandler = (e) => {
                    if (e.key === 'Enter') {
                        this.addNewTag();
                    }
                };
            }

            // Re-add the listener to the fresh element
            this.newTagInput.addEventListener('keypress', this.tagInputHandler);
            console.log('Individual tag input event listener re-bound successfully');
        } else {
            console.warn('newTagInput element not found - tooltip may be closed');
        }
    }

    async addNewTag() {
        // Always get fresh element reference - don't rely on stored references
        const newTagInput = document.getElementById('new-tag-input');

        if (!newTagInput) {
            console.error('newTagInput element not found in addNewTag');
            return;
        }

        const tagName = newTagInput.value.trim();
        if (!tagName || tagName.length === 0) return;

        // Validate tag name
        if (tagName.length > 20) {
            await this.showAlert('Tag name must be 20 characters or less');
            return;
        }

        if (!/^[a-zA-Z0-9\-_\s]+$/.test(tagName)) {
            await this.showAlert('Tag names can only contain letters, numbers, spaces, hyphens, and underscores');
            return;
        }

        if (this.currentContextCollectionId) {
            // Add the new tag to the global tag bank
            this.allTags.add(tagName);
            // Add it to the current collection (always add when creating new tag)
            const collection = this.collections.find(c => c.id === this.currentContextCollectionId);
            if (collection && !collection.tags.includes(tagName)) {
                collection.tags.push(tagName);
                this.renderCollections();
                this.saveSettings();

                // Refresh the context menu to show the new tag
                if (this.tagContextMenu.style.display === 'block') {
                    this.refreshTagContextMenu();
                    // Restore focus to the input after refresh
                    setTimeout(() => {
                        const freshInput = document.getElementById('new-tag-input');
                        if (freshInput) {
                            freshInput.focus();
                        }
                    }, 50);
                }
            }
            // Clear the input field after adding the tag
            newTagInput.value = '';
        }
    }

    renderTagFilters() {
        const tagFiltersContainer = this.tagFilters;
        const clearBtn = this.clearFiltersBtn;

        if (this.allTags.size === 0) {
            tagFiltersContainer.innerHTML = '<span class="no-tags-text">No tags available</span>';
            clearBtn.style.display = 'block'; // Keep visible even with no tags
            return;
        }

        tagFiltersContainer.innerHTML = [...this.allTags].sort().map(tag => {
            const isSelected = this.selectedTags.has(tag);
            const isExcluded = this.excludedTags.has(tag);
            let tagClass = 'filter-tag';
            if (isSelected) tagClass += ' active';
            if (isExcluded) tagClass += ' excluded';
            return `<span class="${tagClass}" onclick="app.toggleTagFilter('${tag}')" oncontextmenu="event.preventDefault(); app.toggleTagExclusion('${tag}')">${tag}</span>`;
        }).join('');

        clearBtn.style.display = 'block'; // Always visible

        // Update text filter UI as well
        this.updateTextFilterUI();
    }

    toggleTagFilter(tag) {
        // Remove from excluded if it's there
        this.excludedTags.delete(tag);

        if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
        } else {
            this.selectedTags.add(tag);
        }
        this.renderCollections();
    }

    toggleTagExclusion(tag) {
        // Remove from selected if it's there
        this.selectedTags.delete(tag);

        if (this.excludedTags.has(tag)) {
            this.excludedTags.delete(tag);
        } else {
            this.excludedTags.add(tag);
        }
        this.renderCollections();
    }

    clearTagFilters() {
        this.selectedTags.clear();
        this.excludedTags.clear();
        this.renderCollections();
    }

    clearAllFilters() {
        this.selectedTags.clear();
        this.excludedTags.clear();
        this.clearTextFilter();
        this.renderCollections();
    }

    updateTextFilter(value) {
        this.textFilter = value.trim();
        this.updateTextFilterUI();
        this.renderCollections();
    }

    clearTextFilter() {
        this.textFilter = '';
        this.textFilterInput.value = '';
        this.updateTextFilterUI();
        this.renderCollections();
    }

    updateTextFilterUI() {
        const hasTextFilter = this.textFilter.length > 0;
        this.clearTextFilterBtn.style.display = hasTextFilter ? 'block' : 'none';

        // Update clear filters button text to reflect all filter types
        const hasAnyFilter = hasTextFilter || this.selectedTags.size > 0 || this.excludedTags.size > 0;
        this.clearFiltersBtn.textContent = hasAnyFilter ? 'Clear All Filters' : 'Clear Filters';
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

            await this.showAlert(`Cache cleared! Removed ${clearedCount} thumbnails from memory. Thumbnails will regenerate as needed.`);
        } catch (error) {
            console.error('Error clearing cache:', error);
            await this.showAlert('Error clearing cache. Check console for details.');
        }
    }

    // Mass Tag Management Methods
    showMassAddTagDialog() {
        // Clear any lingering focus states from popups
        this.clearFocusState();

        // Populate existing tags
        const existingTags = [...this.allTags].sort();
        this.massAddExistingTags.innerHTML = existingTags.length > 0 ?
            existingTags.map(tag =>
                `<span class="tag-option" onclick="app.addTagToSelected('${tag}')">${tag}</span>`
            ).join('') :
            '<span style="color: #888; font-style: italic;">No existing tags</span>';

        // Clear input and show dialog
        const massAddTagInput = document.getElementById('mass-add-tag-input');
        if (massAddTagInput) {
            massAddTagInput.value = '';
        }
        this.massTagAddDialog.style.display = 'flex';

        // Ensure the mass add input has its event listener and is interactive
        setTimeout(() => {
            this.ensureMassTagInputEventListener();
            // Ensure input is properly interactive after popup-related focus issues
            const massAddInput = document.getElementById('mass-add-tag-input');
            if (massAddInput) {
                massAddInput.removeAttribute('disabled');
                massAddInput.style.pointerEvents = 'auto';
            }
            window.focus();
        }, 100);
    }

    hideMassAddTagDialog() {
        this.massTagAddDialog.style.display = 'none';
        // Re-initialize individual tag input elements after mass operations
        this.reinitializeTagElements();
    }

    showMassRemoveTagDialog() {
        // Clear any lingering focus states from popups
        this.clearFocusState();

        const selectedCollections = this.collections.filter(c => c.enabled);

        // Get all tags present in selected collections
        const tagsInSelected = new Set();
        selectedCollections.forEach(collection => {
            collection.tags.forEach(tag => tagsInSelected.add(tag));
        });

        const sortedTags = [...tagsInSelected].sort();
        this.massRemoveTagsList.innerHTML = sortedTags.length > 0 ?
            sortedTags.map(tag =>
                `<span class="tag-option" onclick="app.removeTagFromSelected('${tag}')">${tag}</span>`
            ).join('') :
            '<span style="color: #888; font-style: italic;">No tags to remove</span>';

        this.massTagRemoveDialog.style.display = 'flex';
    }

    hideMassRemoveTagDialog() {
        this.massTagRemoveDialog.style.display = 'none';
        // Re-initialize individual tag input elements after mass operations
        this.reinitializeTagElements();
    }

    async createAndAddTag() {
        // Always get fresh element reference
        const massAddTagInput = document.getElementById('mass-add-tag-input');
        if (!massAddTagInput) {
            console.error('massAddTagInput element not found');
            return;
        }

        const tagName = massAddTagInput.value.trim();
        if (!tagName || tagName.length === 0) return;

        // Validate tag name
        if (tagName.length > 20) {
            await this.showAlert('Tag name must be 20 characters or less');
            return;
        }

        if (!/^[a-zA-Z0-9\-_\s]+$/.test(tagName)) {
            await this.showAlert('Tag names can only contain letters, numbers, spaces, hyphens, and underscores');
            return;
        }

        await this.addTagToSelected(tagName);
    }

    async addTagToSelected(tagName) {
        const selectedCollections = this.collections.filter(c => c.enabled);

        if (selectedCollections.length === 0) {
            this.hideMassAddTagDialog();
            return;
        }

        // Store tooltip state before DOM operations
        const wasTooltipOpen = this.tagContextMenu.style.display === 'block';
        const tooltipCollectionId = this.currentContextCollectionId;
        const tooltipInputValue = this.newTagInput ? this.newTagInput.value : '';

        let addedCount = 0;
        selectedCollections.forEach(collection => {
            if (!collection.tags.includes(tagName)) {
                collection.tags.push(tagName);
                addedCount++;
            }
        });

        // Add to global tag bank
        this.allTags.add(tagName);

        this.rebuildTagBank();
        this.renderCollections();
        this.saveSettings();

        this.hideMassAddTagDialog();

        // Restore tooltip state if it was open
        if (wasTooltipOpen && tooltipCollectionId) {
            setTimeout(() => {
                this.currentContextCollectionId = tooltipCollectionId;
                this.refreshTagContextMenu();
                // Restore input value if it had one
                if (tooltipInputValue && this.newTagInput) {
                    this.newTagInput.value = tooltipInputValue;
                }
            }, 50);
        }

        if (addedCount > 0) {
            const message = addedCount === selectedCollections.length ?
                `Added "${tagName}" to all ${selectedCollections.length} selected collection(s).` :
                `Added "${tagName}" to ${addedCount} of ${selectedCollections.length} selected collection(s). ${selectedCollections.length - addedCount} already had this tag.`;
            await this.showAlert(message);
        } else {
            await this.showAlert(`All selected collections already have the tag "${tagName}".`);
        }

        // Force complete cleanup and reset after mass operations
        setTimeout(() => {
            this.forceCompleteReset();
        }, 100);
    }

    async removeTagFromSelected(tagName) {
        const selectedCollections = this.collections.filter(c => c.enabled);

        if (selectedCollections.length === 0) {
            this.hideMassRemoveTagDialog();
            return;
        }

        // Store tooltip state before DOM operations
        const wasTooltipOpen = this.tagContextMenu.style.display === 'block';
        const tooltipCollectionId = this.currentContextCollectionId;
        const tooltipInputValue = this.newTagInput ? this.newTagInput.value : '';

        let removedCount = 0;
        selectedCollections.forEach(collection => {
            const tagIndex = collection.tags.indexOf(tagName);
            if (tagIndex > -1) {
                collection.tags.splice(tagIndex, 1);
                removedCount++;
            }
        });

        this.rebuildTagBank();
        this.renderCollections();
        this.saveSettings();

        this.hideMassRemoveTagDialog();

        // Restore tooltip state if it was open
        if (wasTooltipOpen && tooltipCollectionId) {
            setTimeout(() => {
                this.currentContextCollectionId = tooltipCollectionId;
                this.refreshTagContextMenu();
                // Restore input value if it had one
                if (tooltipInputValue && this.newTagInput) {
                    this.newTagInput.value = tooltipInputValue;
                }
            }, 50);
        }

        if (removedCount > 0) {
            await this.showAlert(`Removed "${tagName}" from ${removedCount} collection(s).`);
        } else {
            await this.showAlert(`None of the selected collections had the tag "${tagName}".`);
        }

        // Force complete cleanup and reset after mass operations
        setTimeout(() => {
            this.forceCompleteReset();
        }, 100);
    }

    forceCompleteReset() {
        // Clear any stuck focus states first
        if (document.activeElement) {
            document.activeElement.blur();
        }

        // Force close all dialogs and tooltips
        this.massTagAddDialog.style.display = 'none';
        this.massTagRemoveDialog.style.display = 'none';
        this.tagContextMenu.style.display = 'none';

        // Clear any modal or overlay backgrounds
        const overlays = document.querySelectorAll('.mass-tag-dialog, .tag-context-menu');
        overlays.forEach(overlay => {
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
            overlay.style.pointerEvents = 'none';
        });

        // Reset tooltip state
        this.currentContextCollectionId = null;

        // Force focus to body to clear any stuck focus states
        document.body.focus();

        // Force DOM refresh with a small delay
        setTimeout(() => {
            // Re-initialize all elements to ensure clean state
            this.initializeElements();
            this.bindEvents();
            this.renderCollections();

            // Clear focus again after DOM changes
            if (document.activeElement) {
                document.activeElement.blur();
            }
            document.body.focus();

            // Ensure all dialogs are completely reset
            setTimeout(() => {
                this.massTagAddDialog.style.visibility = 'visible';
                this.massTagRemoveDialog.style.visibility = 'visible';
                this.tagContextMenu.style.visibility = 'visible';

                overlays.forEach(overlay => {
                    overlay.style.pointerEvents = 'auto';
                });

                // Final focus cleanup - simulate window focus event
                setTimeout(() => {
                    window.focus();
                    document.body.focus();
                }, 10);
            }, 50);
        }, 50);
    }

    // Custom Modal System
    createModal(type, message, title = null) {
        return new Promise((resolve) => {
            // Create modal overlay
            const modal = document.createElement('div');
            modal.className = 'custom-modal';

            // Create modal content
            const content = document.createElement('div');
            content.className = 'custom-modal-content';

            // Add title if provided
            let titleHtml = '';
            if (title) {
                titleHtml = `<div class="custom-modal-header">${title}</div>`;
            }

            // Create message
            const messageHtml = `<div class="custom-modal-message">${message}</div>`;

            // Create buttons based on type
            let buttonsHtml = '';
            if (type === 'alert') {
                buttonsHtml = `
                    <div class="custom-modal-buttons">
                        <button class="custom-modal-btn primary" onclick="this.closest('.custom-modal').resolve(true)">OK</button>
                    </div>
                `;
            } else if (type === 'confirm') {
                buttonsHtml = `
                    <div class="custom-modal-buttons">
                        <button class="custom-modal-btn secondary" onclick="this.closest('.custom-modal').resolve(false)">Cancel</button>
                        <button class="custom-modal-btn primary" onclick="this.closest('.custom-modal').resolve(true)">OK</button>
                    </div>
                `;
            }

            content.innerHTML = titleHtml + messageHtml + buttonsHtml;
            modal.appendChild(content);

            // Add resolve function to modal for button clicks
            modal.resolve = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            // Handle click outside to close (for alerts only)
            if (type === 'alert') {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.resolve(true);
                    }
                });
            }

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleEscape);
                    modal.resolve(type === 'confirm' ? false : true);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Add to DOM
            document.body.appendChild(modal);

            // Focus the primary button for keyboard navigation
            setTimeout(() => {
                const primaryBtn = modal.querySelector('.custom-modal-btn.primary');
                if (primaryBtn) {
                    primaryBtn.focus();
                }
            }, 50);
        });
    }

    // Custom alert that returns a promise
    async showAlert(message, title = null) {
        return await this.createModal('alert', message, title);
    }

    // Custom confirm that returns a promise
    async showConfirm(message, title = null) {
        return await this.createModal('confirm', message, title);
    }

    clearFocusState() {
        // Keep this method for the tag tooltip fix, but simplify it
        // since we no longer need the complex focus restoration
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
        setTimeout(() => {
            window.focus();
        }, 1);
    }

    // Backup management methods
    async showBackupDialog() {
        try {
            const backups = await window.electronAPI.getBackupList();

            if (backups.length === 0) {
                await this.showAlert('No backups available.');
                return;
            }

            let dialogHTML = '<h3>Available Backups</h3><ul style="list-style: none; padding: 0; max-height: 300px; overflow-y: auto;">';

            backups.forEach((backup, index) => {
                dialogHTML += `
                    <li style="padding: 8px; border: 1px solid #444; margin: 4px 0; cursor: pointer; background: #333;"
                        onclick="window.app.restoreBackup('${backup.filename}')">
                        <strong>${backup.date}</strong><br>
                        <small style="color: #888;">${backup.filename}</small>
                    </li>
                `;
            });

            dialogHTML += '</ul><p style="color: #888; font-size: 0.9em;">Click on a backup to restore it. <strong>Warning:</strong> This will replace your current settings permanently!</p>';

            // Create a custom dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); z-index: 10000; display: flex;
                align-items: center; justify-content: center;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: #2a2a2a; padding: 20px; border-radius: 8px;
                max-width: 500px; width: 90%; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            `;
            content.innerHTML = dialogHTML + '<br><button onclick="window.app.closeBackupDialog()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>';

            dialog.appendChild(content);
            document.body.appendChild(dialog);

            this.currentBackupDialog = dialog;

        } catch (error) {
            console.error('Error showing backup dialog:', error);
            await this.showAlert('Error loading backup list.');
        }
    }

    async restoreBackup(backupFilename) {
        const warningMessage = `⚠️ WARNING: This will completely replace your current settings!

This action will:
• Delete all your current collections and tags
• Replace all timer and session settings
• Cannot be undone

Are you absolutely sure you want to restore from this backup?

Current settings will be permanently lost!`;

        if (!(await this.showConfirm(warningMessage))) {
            return;
        }

        try {
            const restoredSettings = await window.electronAPI.restoreFromBackup(backupFilename);

            // Reload the app with restored settings
            this.settings = restoredSettings;
            this.collections = restoredSettings.collections || [];
            this.timerDurationInput.value = restoredSettings.timerDuration || 60;
            this.sessionLengthInput.value = restoredSettings.sessionLength || 10;
            this.iconSize = restoredSettings.iconSize || 'small';

            // Update UI
            this.updateIconSizeButtons();
            this.rebuildTagBank();
            this.renderCollections();

            this.closeBackupDialog();
            await this.showAlert('Settings restored successfully from backup.\n\nYour previous settings have been replaced.');

        } catch (error) {
            console.error('Error restoring backup:', error);
            await this.showAlert('Error restoring from backup. Please try again.');
        }
    }

    closeBackupDialog() {
        if (this.currentBackupDialog) {
            document.body.removeChild(this.currentBackupDialog);
            this.currentBackupDialog = null;
        }
    }

    // Delete backup management methods
    async showDeleteBackupDialog() {
        try {
            const backups = await window.electronAPI.getBackupList();

            if (backups.length === 0) {
                await this.showAlert('No backups available to delete.');
                return;
            }

            let dialogHTML = '<h3>Delete Backups</h3>';

            // Add "Delete All" button at the top
            dialogHTML += '<div style="margin-bottom: 15px;">';
            dialogHTML += '<button onclick="window.app.deleteAllBackups()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">⚠️ Delete All Backups</button>';
            dialogHTML += '</div>';

            dialogHTML += '<p style="color: #888; font-size: 0.9em; margin-bottom: 15px;">Click on individual backups to delete them:</p>';
            dialogHTML += '<ul style="list-style: none; padding: 0; max-height: 300px; overflow-y: auto;">';

            backups.forEach((backup, index) => {
                dialogHTML += `
                    <li style="padding: 8px; border: 1px solid #444; margin: 4px 0; display: flex; justify-content: space-between; align-items: center; background: #333;">
                        <div>
                            <strong>${backup.date}</strong><br>
                            <small style="color: #888;">${backup.filename}</small>
                        </div>
                        <button onclick="window.app.deleteIndividualBackup('${backup.filename}')"
                                style="background: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                            Delete
                        </button>
                    </li>
                `;
            });

            dialogHTML += '</ul>';

            // Create a custom dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); z-index: 10000; display: flex;
                align-items: center; justify-content: center;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: #2a2a2a; padding: 20px; border-radius: 8px;
                max-width: 600px; width: 90%; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            `;
            content.innerHTML = dialogHTML + '<br><button onclick="window.app.closeDeleteBackupDialog()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>';

            dialog.appendChild(content);
            document.body.appendChild(dialog);

            this.currentDeleteBackupDialog = dialog;

        } catch (error) {
            console.error('Error showing delete backup dialog:', error);
            await this.showAlert('Error loading backup list.');
        }
    }

    async deleteIndividualBackup(backupFilename) {
        const warningMessage = `Are you sure you want to delete this backup?

${backupFilename}

This action cannot be undone.`;

        if (!(await this.showConfirm(warningMessage))) {
            return;
        }

        try {
            await window.electronAPI.deleteBackup(backupFilename);
            await this.showAlert('Backup deleted successfully.');

            // Close and reopen the dialog to refresh the list
            this.closeDeleteBackupDialog();
            this.showDeleteBackupDialog();

        } catch (error) {
            console.error('Error deleting backup:', error);
            await this.showAlert('Error deleting backup. Please try again.');
        }
    }

    async deleteAllBackups() {
        const warningMessage = `⚠️ WARNING: Delete ALL backups?

This will permanently delete ALL backup files.
This action cannot be undone.

Are you absolutely sure?`;

        if (!(await this.showConfirm(warningMessage))) {
            return;
        }

        try {
            const deletedCount = await window.electronAPI.deleteAllBackups();
            await this.showAlert(`Successfully deleted ${deletedCount} backup(s).`);

            this.closeDeleteBackupDialog();

        } catch (error) {
            console.error('Error deleting all backups:', error);
            await this.showAlert('Error deleting backups. Please try again.');
        }
    }

    closeDeleteBackupDialog() {
        if (this.currentDeleteBackupDialog) {
            document.body.removeChild(this.currentDeleteBackupDialog);
            this.currentDeleteBackupDialog = null;
        }
    }

    // Practice Sets Management
    renderPracticeSetsDropdown() {
        // Check if dropdown element exists
        if (!this.practiceSetsDropdown) {
            console.error('Practice sets dropdown element not found!');
            return;
        }

        // Clear existing options except the first one
        this.practiceSetsDropdown.innerHTML = '<option value="">Select Practice Set...</option>';

        // Add practice sets to dropdown
        const sortedSets = Object.keys(this.practiceSets).sort();
        console.log('Rendering practice sets dropdown with sets:', sortedSets);

        sortedSets.forEach(setName => {
            const option = document.createElement('option');
            option.value = setName;
            option.textContent = setName;
            this.practiceSetsDropdown.appendChild(option);
        });

        // Update button states
        this.updatePracticeSetButtons();
    }

    updatePracticeSetButtons() {
        // Safely check if elements exist before accessing them
        if (!this.savePracticeSetBtn || !this.updatePracticeSetBtn || !this.deletePracticeSetBtn) {
            console.warn('Practice set buttons not found during updatePracticeSetButtons');
            return;
        }

        const hasSelection = this.getSelectedCollections().length > 0;
        const hasPracticeSet = this.currentPracticeSet && this.practiceSets[this.currentPracticeSet];

        this.savePracticeSetBtn.disabled = !hasSelection;
        this.updatePracticeSetBtn.disabled = !hasPracticeSet || !hasSelection;
        this.deletePracticeSetBtn.disabled = !hasPracticeSet;
    }

    getSelectedCollections() {
        return this.collections.filter(c => c.enabled);
    }

    showSavePracticeSetDialog() {
        const selectedCollections = this.getSelectedCollections();
        if (selectedCollections.length === 0) {
            this.showAlert('Please select at least one collection to save as a practice set.');
            return;
        }

        this.practiceSetSelectedCount.textContent = `${selectedCollections.length} collection(s) selected`;
        this.practiceSetNameInput.value = '';
        this.savePracticeSetDialog.style.display = 'flex';

        setTimeout(() => {
            this.practiceSetNameInput.focus();
        }, 100);
    }

    hideSavePracticeSetDialog() {
        this.savePracticeSetDialog.style.display = 'none';
    }

    async savePracticeSet() {
        const name = this.practiceSetNameInput.value.trim();
        if (!name) {
            await this.showAlert('Please enter a name for the practice set.');
            return;
        }

        if (name.length > 30) {
            await this.showAlert('Practice set name must be 30 characters or less.');
            return;
        }

        if (!/^[a-zA-Z0-9\-_\s]+$/.test(name)) {
            await this.showAlert('Practice set names can only contain letters, numbers, spaces, hyphens, and underscores.');
            return;
        }

        const selectedCollections = this.getSelectedCollections();
        if (selectedCollections.length === 0) {
            await this.showAlert('Please select at least one collection.');
            return;
        }

        // Check if name already exists
        if (this.practiceSets[name]) {
            const overwrite = await this.showConfirm(`A practice set named "${name}" already exists. Do you want to overwrite it?`);
            if (!overwrite) return;
        }

        // Save practice set
        this.practiceSets[name] = {
            collections: selectedCollections.map(c => c.id),
            createdAt: Date.now(),
            collectionCount: selectedCollections.length
        };

        await this.saveSettings();
        this.renderPracticeSetsDropdown();
        this.hideSavePracticeSetDialog();

        await this.showAlert(`Practice set "${name}" saved with ${selectedCollections.length} collection(s).`);
    }

    async loadPracticeSet(setName) {
        console.log('loadPracticeSet called with:', setName);
        console.log('Available practice sets:', Object.keys(this.practiceSets));

        if (!setName || !this.practiceSets[setName]) {
            this.currentPracticeSet = null;
            this.updatePracticeSetButtons();
            return;
        }

        this.currentPracticeSet = setName;
        const practiceSet = this.practiceSets[setName];
        console.log('Loading practice set:', setName, practiceSet);

        // Deselect all collections first
        this.collections.forEach(collection => {
            collection.enabled = false;
        });

        // Select collections in the practice set
        let foundCount = 0;
        practiceSet.collections.forEach(collectionId => {
            const collection = this.collections.find(c => c.id === collectionId);
            if (collection) {
                collection.enabled = true;
                foundCount++;
            }
        });

        // Update UI
        this.renderCollections();
        this.updatePracticeSetButtons();

        // Show info if some collections were missing
        if (foundCount < practiceSet.collections.length) {
            const missingCount = practiceSet.collections.length - foundCount;
            await this.showAlert(`Loaded practice set "${setName}".\n\n${foundCount} of ${practiceSet.collections.length} collections found.\n${missingCount} collection(s) no longer exist.`);
        }
    }

    async updateCurrentPracticeSet() {
        if (!this.currentPracticeSet) return;

        const selectedCollections = this.getSelectedCollections();
        if (selectedCollections.length === 0) {
            await this.showAlert('Please select at least one collection to update the practice set.');
            return;
        }

        const confirmed = await this.showConfirm(`Update practice set "${this.currentPracticeSet}" with current selection (${selectedCollections.length} collection(s))?`);
        if (!confirmed) return;

        // Update practice set
        this.practiceSets[this.currentPracticeSet] = {
            collections: selectedCollections.map(c => c.id),
            createdAt: this.practiceSets[this.currentPracticeSet].createdAt, // Keep original creation time
            updatedAt: Date.now(),
            collectionCount: selectedCollections.length
        };

        await this.saveSettings();
        await this.showAlert(`Practice set "${this.currentPracticeSet}" updated with ${selectedCollections.length} collection(s).`);
    }

    async deleteCurrentPracticeSet() {
        if (!this.currentPracticeSet) return;

        const confirmed = await this.showConfirm(`Delete practice set "${this.currentPracticeSet}"?\n\nThis action cannot be undone.`);
        if (!confirmed) return;

        delete this.practiceSets[this.currentPracticeSet];
        this.currentPracticeSet = null;
        this.practiceSetsDropdown.value = '';

        await this.saveSettings();
        this.renderPracticeSetsDropdown();
        await this.showAlert('Practice set deleted successfully.');
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
    