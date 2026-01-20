// Seat mapping application
class SeatMapper {
    constructor() {
        // LocalStorage key for persisting seat mappings
        this.STORAGE_KEY = 'workarea_booking_seat_mappings';
        
        // Floor configurations - add/modify floors here
        // Supported formats: .jpg, .jpeg, .png, .gif, .webp, .pdf
        this.floors = [
            { id: 'floor_14', name: 'Floor 14', file: 'floor_plan_14th.png' },
            { id: 'floor_15', name: 'Floor 15', file: 'floor_plan_15th.png' },
            { id: 'floor_18', name: 'Floor 18', file: 'floor_plan_18th.png' }
        ];
        
        // Current floor
        this.currentFloorId = this.floors[0].id;
        
        // Per-floor seat data: { floorId: { seats: [], nextSeatNumber: 1 } }
        this.floorData = {};
        this.initializeFloorData();
        
        // Load saved data from localStorage
        this.hasStoredData = this.loadFromStorage();
        
        // DOM elements
        this.image = document.getElementById('floorImage');
        this.pdfCanvas = document.getElementById('pdfCanvas');
        this.imageWrapper = document.getElementById('imageWrapper');
        this.imageContainerInner = document.getElementById('imageContainerInner');
        this.markerOverlay = document.getElementById('markerOverlay');
        this.seatList = document.getElementById('seatList');
        this.exportBtn = document.getElementById('exportBtn');
        this.exportAllBtn = document.getElementById('exportAllBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.saveToFileBtn = document.getElementById('saveToFileBtn');
        this.loadFromFileBtn = document.getElementById('loadFromFileBtn');
        this.fileInput = document.getElementById('fileInput');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        this.updateOverlayBtn = document.getElementById('updateOverlayBtn');
        this.floorSelect = document.getElementById('floorSelect');
        this.floorNameBadge = document.getElementById('floorNameBadge');
        
        // Grid control elements
        this.gridToggleBtn = document.getElementById('gridToggleBtn');
        this.gridDecreaseBtn = document.getElementById('gridDecreaseBtn');
        this.gridIncreaseBtn = document.getElementById('gridIncreaseBtn');
        this.gridSizeDisplay = document.getElementById('gridSize');
        this.gridOverlay = document.getElementById('gridOverlay');
        
        // Mapping panel
        this.mappingPanel = document.getElementById('mappingPanel');
        
        // Floor plan element (will be set to either image or canvas)
        this.floorPlanElement = null;
        this.isPDF = false;
        
        // Zoom state
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomStep = 0.1;
        
        // Grid state
        this.gridEnabled = false;
        this.gridSize = 5; // pixels
        this.minGridSize = 5;
        this.maxGridSize = 100;
        this.gridSizeStep = 5;
        
        // Drag state
        this.isDragging = false;
        this.draggedSeat = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        this.init();
    }
    
    // Getters for current floor data
    get seats() {
        return this.floorData[this.currentFloorId].seats;
    }
    
    set seats(value) {
        this.floorData[this.currentFloorId].seats = value;
    }
    
    get nextSeatNumber() {
        return this.floorData[this.currentFloorId].nextSeatNumber;
    }
    
    set nextSeatNumber(value) {
        this.floorData[this.currentFloorId].nextSeatNumber = value;
    }
    
    get currentFloor() {
        return this.floors.find(f => f.id === this.currentFloorId);
    }
    
    get floorPlanSource() {
        return this.currentFloor.file;
    }
    
    // Initialize floor data structure for all floors
    initializeFloorData() {
        this.floors.forEach(floor => {
            if (!this.floorData[floor.id]) {
                this.floorData[floor.id] = {
                    seats: [],
                    nextSeatNumber: 1
                };
            }
        });
    }
    
    // Load seat mappings from localStorage
    // Returns true if data was loaded, false otherwise
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                
                // Check if there's any actual seat data
                let hasSeats = false;
                
                // Restore floor data for each floor
                this.floors.forEach(floor => {
                    if (parsed[floor.id]) {
                        this.floorData[floor.id] = {
                            seats: parsed[floor.id].seats || [],
                            nextSeatNumber: parsed[floor.id].nextSeatNumber || 1
                        };
                        if (parsed[floor.id].seats && parsed[floor.id].seats.length > 0) {
                            hasSeats = true;
                        }
                    }
                });
                
                if (hasSeats) {
                    console.log('Loaded seat mappings from localStorage');
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load seat mappings from localStorage:', error);
            // If loading fails, keep the initialized empty data
        }
        return false;
    }
    
    // Load seat mappings from default file (seat-mappings.json)
    // This is called only if localStorage is empty
    async loadFromDefaultFile() {
        try {
            const response = await fetch('seat-mappings.json');
            
            if (!response.ok) {
                // File doesn't exist or can't be fetched - this is normal, just skip
                return false;
            }
            
            const importData = await response.json();
            
            // Validate the data
            if (!this.validateImportData(importData)) {
                console.warn('seat-mappings.json has invalid format, skipping');
                return false;
            }
            
            // Import the data
            this.importSeatMappings(importData);
            
            // Save to localStorage so it persists
            this.saveToStorage();
            
            console.log('Loaded seat mappings from seat-mappings.json');
            return true;
            
        } catch (error) {
            // Silently fail - file might not exist or network error
            // This is expected behavior when no default file is present
            return false;
        }
    }
    
    // Save seat mappings to localStorage
    saveToStorage() {
        try {
            const dataToSave = {};
            
            this.floors.forEach(floor => {
                dataToSave[floor.id] = {
                    seats: this.floorData[floor.id].seats.map(seat => ({
                        number: seat.number,
                        normalizedX: seat.normalizedX,
                        normalizedY: seat.normalizedY
                    })),
                    nextSeatNumber: this.floorData[floor.id].nextSeatNumber
                };
            });
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('Failed to save seat mappings to localStorage:', error);
        }
    }
    
    // Clear all saved mappings from localStorage
    clearStorage() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('Cleared all seat mappings from localStorage');
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }
    
    // Clear all seat data from all floors and storage
    clearAllData() {
        if (!confirm('Are you sure you want to clear ALL seat mappings from ALL floors? This cannot be undone.')) {
            return;
        }
        
        // Reset all floor data
        this.floors.forEach(floor => {
            this.floorData[floor.id] = {
                seats: [],
                nextSeatNumber: 1
            };
        });
        
        // Clear localStorage
        this.clearStorage();
        
        // Update UI
        this.updateUI();
        
        alert('All seat mappings have been cleared.');
    }
    
    
    async init() {
        // If no localStorage data, try loading from default file
        if (!this.hasStoredData) {
            await this.loadFromDefaultFile();
        }
        
        // Populate floor selector
        this.populateFloorSelector();
        
        // Load current floor
        this.loadCurrentFloor();

        this.toggleGrid();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateOverlaySize();
            this.updateMarkers();
        });
        
        // Drag event handlers (attached to document for smooth dragging)
        document.addEventListener('mousemove', (e) => {
            this.handleDragMove(e);
        });
        
        document.addEventListener('mouseup', (e) => {
            this.handleDragEnd(e);
        });
        
        // Floor selector change
        this.floorSelect.addEventListener('change', (e) => {
            this.switchFloor(e.target.value);
        });
        
        // Export button - current floor
        this.exportBtn.addEventListener('click', () => {
            this.exportToConsole();
        });
        
        // Export all floors button
        this.exportAllBtn.addEventListener('click', () => {
            this.exportAllFloors();
        });
        
        // Save to file button
        this.saveToFileBtn.addEventListener('click', () => {
            this.saveToFile();
        });
        
        // Load from file button
        this.loadFromFileBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        // File input change handler
        this.fileInput.addEventListener('change', (e) => {
            this.loadFromFile(e.target.files[0]);
            // Reset file input so the same file can be selected again
            this.fileInput.value = '';
        });
        
        // Clear all data button
        this.clearAllBtn.addEventListener('click', () => {
            this.clearAllData();
        });
        
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => {
            this.zoomIn();
        });
        
        this.zoomOutBtn.addEventListener('click', () => {
            this.zoomOut();
        });
        
        this.resetZoomBtn.addEventListener('click', () => {
            this.resetZoom();
        });
        
        // Update overlay button
        this.updateOverlayBtn.addEventListener('click', () => {
            this.updateUI();
        });
        
        // Grid controls
        this.gridToggleBtn.addEventListener('click', () => {
            this.toggleGrid();
        });
        
        this.gridDecreaseBtn.addEventListener('click', () => {
            this.decreaseGridSize();
        });
        
        this.gridIncreaseBtn.addEventListener('click', () => {
            this.increaseGridSize();
        });
        
    }
    
    populateFloorSelector() {
        // Clear existing options
        this.floorSelect.innerHTML = '';
        
        // Add an option for each floor
        this.floors.forEach(floor => {
            const option = document.createElement('option');
            option.value = floor.id;
            option.textContent = floor.name;
            if (floor.id === this.currentFloorId) {
                option.selected = true;
            }
            this.floorSelect.appendChild(option);
        });
    }
    
    loadCurrentFloor() {
        // Determine if source is PDF or image
        this.isPDF = this.floorPlanSource.toLowerCase().endsWith('.pdf');
        
        // Update floor name badge
        this.floorNameBadge.textContent = this.currentFloor.name;
        
        // Reset zoom when loading new floor
        this.zoom = 1.0;
        this.imageContainerInner.style.transform = `scale(${this.zoom})`;
        this.zoomLevelDisplay.textContent = '100%';
        
        if (this.isPDF) {
            this.loadPDF();
        } else {
            this.loadImage();
        }
    }
    
    switchFloor(floorId) {
        // Check if floor exists
        const floor = this.floors.find(f => f.id === floorId);
        if (!floor) {
            console.error('Floor not found:', floorId);
            return;
        }
        
        // Update current floor
        this.currentFloorId = floorId;
        
        // Clear grid if enabled
        if (this.gridEnabled) {
            this.clearGrid();
        }
        
        // Load the new floor
        this.loadCurrentFloor();
        this.updateUI();
    }
    
    loadImage() {
        // Use the image element
        this.floorPlanElement = this.image;
        this.image.style.display = 'block';
        this.pdfCanvas.style.display = 'none';
        this.image.src = this.floorPlanSource;
        
        // Check if image is already loaded (cached images)
        if (this.image.complete && this.image.naturalHeight !== 0) {
            this.onFloorPlanLoaded();
        } else {
            // Wait for image to load
            this.image.onload = () => {
                this.onFloorPlanLoaded();
            };
            
            // Handle image load error
            this.image.onerror = () => {
                console.error('Failed to load floor plan image');
                alert(`Error: Could not load floor plan image. Please check that ${this.floorPlanSource} exists.`);
            };
        }
    }
    
    async loadPDF() {
        try {
            // Configure PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument(this.floorPlanSource);
            const pdf = await loadingTask.promise;
            
            // Get the first page
            const page = await pdf.getPage(1);
            
            // Set scale for good quality rendering (2x for high DPI displays)
            const scale = 2;
            const viewport = page.getViewport({ scale });
            
            // Set canvas dimensions
            this.pdfCanvas.width = viewport.width;
            this.pdfCanvas.height = viewport.height;
            
            // Set display size (CSS pixels)
            this.pdfCanvas.style.width = (viewport.width / scale) + 'px';
            this.pdfCanvas.style.height = (viewport.height / scale) + 'px';
            
            // Get canvas context
            const context = this.pdfCanvas.getContext('2d');
            
            // Render the page to canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Show canvas, hide image
            this.pdfCanvas.style.display = 'block';
            this.image.style.display = 'none';
            
            // Use canvas as the floor plan element
            this.floorPlanElement = this.pdfCanvas;
            
            // Set natural dimensions for coordinate calculations
            // Use the CSS display size (not the high-res canvas size)
            this.pdfCanvas.naturalWidth = viewport.width / scale;
            this.pdfCanvas.naturalHeight = viewport.height / scale;
            
            this.onFloorPlanLoaded();
            
        } catch (error) {
            console.error('Failed to load PDF:', error);
            alert(`Error: Could not load PDF. Please check that ${this.floorPlanSource} exists and is a valid PDF.`);
        }
    }
    
    onFloorPlanLoaded() {
        this.setupEventListeners();
        this.updateOverlaySize();
        
        // Mouse wheel zoom
        this.imageWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
            this.setZoom(this.zoom + delta);
        }, { passive: false });
        
        // Update UI to show seat markers and list for the loaded floor
        this.updateUI();
    }
    
    setupEventListeners() {
        // Check if already set up
        if (this.imageWrapper.hasAttribute('data-listeners-setup')) {
            return;
        }
        
        // Left click to add seat - attach to wrapper so clicks work anywhere
        this.imageWrapper.addEventListener('click', (e) => {
            // Only process if click is on the floor plan element, wrapper, or container inner (not on markers)
            if (e.target === this.floorPlanElement || e.target === this.image || e.target === this.pdfCanvas || 
                e.target === this.imageWrapper || e.target === this.imageContainerInner) {
                this.addSeat(e);
            }
        });
        
        // Right click to remove seat
        this.imageWrapper.addEventListener('contextmenu', (e) => {
            // Only process if click is on the floor plan element, wrapper, or container inner (not on markers)
            if (e.target === this.floorPlanElement || e.target === this.image || e.target === this.pdfCanvas || 
                e.target === this.imageWrapper || e.target === this.imageContainerInner) {
                e.preventDefault();
                this.removeSeatAtPosition(e);
            }
        });
        
        this.imageWrapper.setAttribute('data-listeners-setup', 'true');
    }
    
    updateOverlaySize() {
        // Get the BASE displayed size of the image (before CSS transform)
        // This is the actual rendered size at 100% zoom, which may be smaller than
        // natural size due to max-width/max-height CSS constraints
        // offsetWidth/offsetHeight give us this pre-transform size
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        
        // IMPORTANT: The overlay is inside imageContainerInner which has CSS transform scale applied
        // We need to set the overlay size to match the floor plan's base size (not natural size)
        // The container's transform will scale both the floor plan and overlay together
        this.markerOverlay.setAttribute('width', baseWidth);
        this.markerOverlay.setAttribute('height', baseHeight);
        
        // Set viewBox to match for proper coordinate system
        this.markerOverlay.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
        
        // Position overlay at same position as floor plan within container
        // Both are direct children of imageContainerInner, so use offsetLeft/offsetTop
        this.markerOverlay.style.left = this.floorPlanElement.offsetLeft + 'px';
        this.markerOverlay.style.top = this.floorPlanElement.offsetTop + 'px';
        
        // Update grid overlay to match
        this.gridOverlay.setAttribute('width', baseWidth);
        this.gridOverlay.setAttribute('height', baseHeight);
        this.gridOverlay.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
        this.gridOverlay.style.left = this.floorPlanElement.offsetLeft + 'px';
        this.gridOverlay.style.top = this.floorPlanElement.offsetTop + 'px';
        
        // Redraw grid if enabled
        if (this.gridEnabled) {
            this.drawGrid();
        }
    }
    
    zoomIn() {
        this.setZoom(this.zoom + this.zoomStep);
    }
    
    zoomOut() {
        this.setZoom(this.zoom - this.zoomStep);
    }
    
    resetZoom() {
        this.setZoom(1.0);
    }
    
    // Grid methods
    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        
        // Update button state
        if (this.gridEnabled) {
            this.gridToggleBtn.classList.add('active');
            this.drawGrid();
        } else {
            this.gridToggleBtn.classList.remove('active');
            this.clearGrid();
        }
    }
    
    increaseGridSize() {
        if (this.gridSize < this.maxGridSize) {
            this.gridSize = Math.min(this.gridSize + this.gridSizeStep, this.maxGridSize);
            this.updateGridSizeDisplay();
            if (this.gridEnabled) {
                this.drawGrid();
            }
        }
    }
    
    decreaseGridSize() {
        if (this.gridSize > this.minGridSize) {
            this.gridSize = Math.max(this.gridSize - this.gridSizeStep, this.minGridSize);
            this.updateGridSizeDisplay();
            if (this.gridEnabled) {
                this.drawGrid();
            }
        }
    }
    
    updateGridSizeDisplay() {
        this.gridSizeDisplay.textContent = this.gridSize + 'px';
    }
    
    drawGrid() {
        // Clear existing grid
        this.gridOverlay.innerHTML = '';
        
        const width = this.floorPlanElement.offsetWidth;
        const height = this.floorPlanElement.offsetHeight;
        
        // Create grid lines
        const fragment = document.createDocumentFragment();
        
        // Vertical lines
        for (let x = 0; x <= width; x += this.gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height);
            line.setAttribute('stroke', 'rgba(0, 0, 0, 0.15)');
            line.setAttribute('stroke-width', '0.5');
            fragment.appendChild(line);
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y += this.gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'rgba(0, 0, 0, 0.15)');
            line.setAttribute('stroke-width', '0.5');
            fragment.appendChild(line);
        }
        
        this.gridOverlay.appendChild(fragment);
    }
    
    clearGrid() {
        this.gridOverlay.innerHTML = '';
    }
    
    snapToGrid(x, y) {
        if (!this.gridEnabled) {
            return { x, y };
        }
        
        // Snap to nearest grid intersection
        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;
        
        return { x: snappedX, y: snappedY };
    }
    
    setZoom(newZoom) {
        // Clamp zoom value
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        
        // Apply zoom transform
        this.imageContainerInner.style.transform = `scale(${this.zoom})`;
        this.imageContainerInner.style.transformOrigin = 'top left';
        
        // Update zoom level display
        this.zoomLevelDisplay.textContent = Math.round(this.zoom * 100) + '%';
        
        // Update overlay after a short delay to allow transform to apply
        // Use requestAnimationFrame for more reliable timing
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.updateOverlaySize();
                this.updateMarkers();
            });
        });
    }
    
    getImageCoordinates(event) {
        const floorPlanRect = this.floorPlanElement.getBoundingClientRect();
        
        // Get click position relative to viewport
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // Calculate click position relative to the floor plan's bounding rect
        // floorPlanRect already accounts for zoom, centering, and transforms
        const x = clickX - floorPlanRect.left;
        const y = clickY - floorPlanRect.top;
        
        // Calculate actual displayed dimensions (zoomed)
        const displayedWidth = floorPlanRect.width;
        const displayedHeight = floorPlanRect.height;
        
        // Clamp coordinates to floor plan bounds
        const clampedX = Math.max(0, Math.min(x, displayedWidth));
        const clampedY = Math.max(0, Math.min(y, displayedHeight));
        
        // Get the BASE displayed size of the floor plan (before CSS transform)
        // This is the actual rendered size at 100% zoom
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        
        // Calculate the current zoom level from displayed vs base size
        // displayedWidth = baseWidth * zoom
        const zoom = displayedWidth / baseWidth;
        
        // Convert displayed coordinates to base coordinates (pre-transform)
        const baseX = clampedX / zoom;
        const baseY = clampedY / zoom;
        
        // Normalize coordinates relative to base size (0-1)
        // This ensures coordinates stay consistent regardless of zoom level
        const normalizedX = baseX / baseWidth;
        const normalizedY = baseY / baseHeight;
        
        return {
            displayX: clampedX,
            displayY: clampedY,
            normalizedX: normalizedX,
            normalizedY: normalizedY,
            imageWidth: displayedWidth,
            imageHeight: displayedHeight
        };
    }
    
    addSeat(event) {
        const coords = this.getImageCoordinates(event);
        
        // Get base dimensions for snapping calculation
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        
        // Convert normalized coordinates to base coordinates for snapping
        let baseX = coords.normalizedX * baseWidth;
        let baseY = coords.normalizedY * baseHeight;
        
        // Apply snap to grid if enabled
        const snapped = this.snapToGrid(baseX, baseY);
        baseX = snapped.x;
        baseY = snapped.y;
        
        // Clamp to bounds
        baseX = Math.max(0, Math.min(baseX, baseWidth));
        baseY = Math.max(0, Math.min(baseY, baseHeight));
        
        // Convert back to normalized coordinates
        const normalizedX = baseX / baseWidth;
        const normalizedY = baseY / baseHeight;
        
        const seat = {
            number: this.nextSeatNumber++,
            normalizedX: normalizedX,
            normalizedY: normalizedY,
            displayX: baseX,
            displayY: baseY
        };
        
        this.seats.push(seat);
        this.saveToStorage();
        this.updateUI();
    }
    
    removeSeatAtPosition(event) {
        const coords = this.getImageCoordinates(event);
        const clickX = coords.displayX;
        const clickY = coords.displayY;
        
        // Find the closest seat within a threshold (5px radius)
        const threshold = 5;
        let closestSeat = null;
        let minDistance = Infinity;
        
        this.seats.forEach((seat, index) => {
            const distance = Math.sqrt(
                Math.pow(seat.displayX - clickX, 2) + 
                Math.pow(seat.displayY - clickY, 2)
            );
            
            if (distance < threshold && distance < minDistance) {
                minDistance = distance;
                closestSeat = { seat, index };
            }
        });
        
        if (closestSeat) {
            this.seats.splice(closestSeat.index, 1);
            // Renumber remaining seats
            this.renumberSeats();
            this.saveToStorage();
            this.updateUI();
        }
    }
    
    renumberSeats() {
        this.seats.sort((a, b) => a.number - b.number);
        this.seats.forEach((seat, index) => {
            seat.number = index + 1;
        });
        this.nextSeatNumber = this.seats.length + 1;
    }
    
    // Drag handlers
    handleDragStart(event, seatNumber) {
        const seat = this.seats.find(s => s.number === seatNumber);
        if (!seat) return;
        
        this.isDragging = true;
        this.draggedSeat = seat;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        
        // Add dragging class to body for cursor
        document.body.classList.add('dragging-marker');
        
        // Highlight the dragged marker
        const circle = this.markerOverlay.querySelector(`circle[data-seat-number="${seatNumber}"]`);
        if (circle) {
            circle.classList.add('dragging');
        }
    }
    
    handleDragMove(event) {
        if (!this.isDragging || !this.draggedSeat) return;
        
        event.preventDefault();
        
        // Get the floor plan's bounding rect (includes zoom transform)
        const imageRect = this.floorPlanElement.getBoundingClientRect();
        
        // Calculate the new position
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // Get position relative to the image
        let x = clickX - imageRect.left;
        let y = clickY - imageRect.top;
        
        // Get the base dimensions and current zoom
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        const displayedWidth = imageRect.width;
        const displayedHeight = imageRect.height;
        const zoom = displayedWidth / baseWidth;
        
        // Convert to base coordinates
        let baseX = x / zoom;
        let baseY = y / zoom;
        
        // Apply snap to grid if enabled
        const snapped = this.snapToGrid(baseX, baseY);
        baseX = snapped.x;
        baseY = snapped.y;
        
        // Clamp to bounds
        baseX = Math.max(0, Math.min(baseX, baseWidth));
        baseY = Math.max(0, Math.min(baseY, baseHeight));
        
        // Convert to normalized coordinates
        const normalizedX = baseX / baseWidth;
        const normalizedY = baseY / baseHeight;
        
        // Update the seat's position
        this.draggedSeat.normalizedX = normalizedX;
        this.draggedSeat.normalizedY = normalizedY;
        this.draggedSeat.displayX = baseX;
        this.draggedSeat.displayY = baseY;
        
        // Update just the marker position (not full updateMarkers for performance)
        const circle = this.markerOverlay.querySelector(`circle[data-seat-number="${this.draggedSeat.number}"]`);
        const text = this.markerOverlay.querySelector(`text[data-seat-number="${this.draggedSeat.number}"]`);
        
        if (circle) {
            circle.setAttribute('cx', baseX);
            circle.setAttribute('cy', baseY);
        }
        if (text) {
            text.setAttribute('x', baseX);
            text.setAttribute('y', baseY);
        }
    }
    
    handleDragEnd(event) {
        if (!this.isDragging) return;
        
        // Remove dragging class
        document.body.classList.remove('dragging-marker');
        
        // Remove highlight from marker
        if (this.draggedSeat) {
            const circle = this.markerOverlay.querySelector(`circle[data-seat-number="${this.draggedSeat.number}"]`);
            if (circle) {
                circle.classList.remove('dragging');
            }
        }
        
        // Save to storage
        this.saveToStorage();
        
        // Update the seat list
        this.updateSeatList();
        
        // Reset drag state
        this.isDragging = false;
        this.draggedSeat = null;
    }
    
    updateMarkers() {
        // Update overlay size and position first
        this.updateOverlaySize();
        
        // Clear existing markers
        this.markerOverlay.innerHTML = '';
        
        // Update display coordinates based on current floor plan size
        const rect = this.floorPlanElement.getBoundingClientRect();
        
        this.seats.forEach((seat) => {
            // Convert normalized coordinates (0-1) to overlay coordinates
            // IMPORTANT: The overlay uses the BASE displayed size (before CSS transform)
            // which may be smaller than natural size due to max-width/max-height constraints
            const baseWidth = this.floorPlanElement.offsetWidth;
            const baseHeight = this.floorPlanElement.offsetHeight;
            
            // Convert normalized to base displayed coordinates
            // Since the overlay matches the floor plan's base size, we multiply by base dimensions
            const baseX = seat.normalizedX * baseWidth;
            const baseY = seat.normalizedY * baseHeight;
            
            // Set overlay coordinates in base (pre-transform) space
            // The container's CSS transform will scale these to the correct displayed position
            seat.displayX = baseX;
            seat.displayY = baseY;
            
            // Create circle marker
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', seat.displayX);
            circle.setAttribute('cy', seat.displayY);
            circle.setAttribute('r', '5');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('data-seat-number', seat.number);
            circle.style.pointerEvents = 'all';
            
            // Store seat number for event handlers
            const seatNumber = seat.number;
            
            // Mapping mode - default color
            circle.setAttribute('fill', '#667eea');
            circle.setAttribute('class', 'marker-circle');
            
            // Add mousedown handler for drag start
            circle.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click only
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleDragStart(e, seatNumber);
                }
            });
            
            // Add right-click handler to circle - use seat number to find and remove
            circle.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const seatIndex = this.seats.findIndex(s => s.number === seatNumber);
                if (seatIndex !== -1) {
                    this.seats.splice(seatIndex, 1);
                    this.renumberSeats();
                    this.saveToStorage();
                    this.updateUI();
                }
            });
            
            // Create text label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', seat.displayX);
            text.setAttribute('y', seat.displayY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '5');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('pointer-events', 'none');
            text.setAttribute('data-seat-number', seat.number);
            text.textContent = seat.number;
            
            this.markerOverlay.appendChild(circle);
            this.markerOverlay.appendChild(text);
        });
    }
    
    updateUI() {
        this.updateMarkers();
        this.updateSeatList();
        this.updateExportButton();
    }
    
    updateSeatList() {
        if (this.seats.length === 0) {
            this.seatList.innerHTML = '<p class="empty-message">No seats mapped yet. Click on the floor plan to start.</p>';
            return;
        }
        
        this.seatList.innerHTML = this.seats.map(seat => `
            <div class="seat-item">
                <div class="seat-info">
                    <div class="seat-number">Seat #${seat.number}</div>
                    <div class="seat-coords">Location: (${seat.normalizedX.toFixed(3)}, ${seat.normalizedY.toFixed(3)})</div>
                </div>
            </div>
        `).join('');
    }
    
    updateExportButton() {
        this.exportBtn.disabled = this.seats.length === 0;
    }
    
    exportToConsole() {
        const floorName = this.currentFloor.name;
        const exportData = {
            floor: floorName,
            floorId: this.currentFloorId,
            totalSeats: this.seats.length,
            seats: this.seats.map(seat => ({
                seatNumber: seat.number,
                location: {
                    normalizedX: parseFloat(seat.normalizedX.toFixed(6)),
                    normalizedY: parseFloat(seat.normalizedY.toFixed(6))
                },
                displayCoordinates: {
                    x: Math.round(seat.displayX),
                    y: Math.round(seat.displayY)
                }
            }))
        };
        
        console.log(`=== Seat Mapping Export: ${floorName} ===`);
        console.log(`Total Seats: ${exportData.totalSeats}`);
        console.log('Seat Data:', exportData);
        console.log('JSON Format:', JSON.stringify(exportData, null, 2));
        console.log('========================');
        
        // Also show an alert for user feedback
        alert(`Exported ${exportData.totalSeats} seat(s) from ${floorName} to console. Open browser DevTools (F12) to view.`);
    }
    
    exportAllFloors() {
        const allFloorsData = {
            exportDate: new Date().toISOString(),
            totalFloors: this.floors.length,
            floors: this.floors.map(floor => {
                const floorSeats = this.floorData[floor.id].seats;
                return {
                    floorId: floor.id,
                    floorName: floor.name,
                    floorPlanFile: floor.file,
                    totalSeats: floorSeats.length,
                    seats: floorSeats.map(seat => ({
                        seatNumber: seat.number,
                        location: {
                            normalizedX: parseFloat(seat.normalizedX.toFixed(6)),
                            normalizedY: parseFloat(seat.normalizedY.toFixed(6))
                        },
                        displayCoordinates: {
                            x: Math.round(seat.displayX),
                            y: Math.round(seat.displayY)
                        }
                    }))
                };
            })
        };
        
        // Calculate total seats across all floors
        const totalSeats = allFloorsData.floors.reduce((sum, floor) => sum + floor.totalSeats, 0);
        
        console.log('=== All Floors Seat Mapping Export ===');
        console.log(`Total Floors: ${allFloorsData.totalFloors}`);
        console.log(`Total Seats Across All Floors: ${totalSeats}`);
        console.log('Export Data:', allFloorsData);
        console.log('JSON Format:', JSON.stringify(allFloorsData, null, 2));
        console.log('======================================');
        
        // Also show an alert for user feedback
        alert(`Exported ${totalSeats} seat(s) from ${allFloorsData.totalFloors} floor(s) to console. Open browser DevTools (F12) to view.`);
    }
    
    // Save all floor data to a JSON file
    saveToFile() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            application: 'Work Area Booking System',
            totalFloors: this.floors.length,
            floorConfiguration: this.floors.map(floor => ({
                id: floor.id,
                name: floor.name,
                file: floor.file
            })),
            seatMappings: {}
        };
        
        // Add seat data for each floor
        this.floors.forEach(floor => {
            const floorSeats = this.floorData[floor.id].seats;
            exportData.seatMappings[floor.id] = {
                nextSeatNumber: this.floorData[floor.id].nextSeatNumber,
                totalSeats: floorSeats.length,
                seats: floorSeats.map(seat => ({
                    number: seat.number,
                    normalizedX: parseFloat(seat.normalizedX.toFixed(6)),
                    normalizedY: parseFloat(seat.normalizedY.toFixed(6))
                }))
            };
        });
        
        // Calculate total seats
        const totalSeats = Object.values(exportData.seatMappings)
            .reduce((sum, floor) => sum + floor.totalSeats, 0);
        exportData.totalSeats = totalSeats;
        
        // Create and download the file
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `seat-mappings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`Saved ${totalSeats} seat(s) from ${this.floors.length} floor(s) to file.`);
    }
    
    // Load floor data from a JSON file
    loadFromFile(file) {
        if (!file) {
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Validate the file format
                if (!this.validateImportData(importData)) {
                    alert('Invalid file format. Please select a valid seat mappings JSON file.');
                    return;
                }
                
                // Ask user how to handle the import
                const action = confirm(
                    'How do you want to import the data?\n\n' +
                    'OK = Replace all existing data\n' +
                    'Cancel = Abort import'
                );
                
                if (!action) {
                    return;
                }
                
                // Import the data
                this.importSeatMappings(importData);
                
                // Save to localStorage
                this.saveToStorage();
                
                // Update UI
                this.updateUI();
                
                // Count imported seats
                let importedSeats = 0;
                let importedFloors = 0;
                
                if (importData.seatMappings) {
                    for (const floorId in importData.seatMappings) {
                        if (this.floorData[floorId]) {
                            importedSeats += importData.seatMappings[floorId].seats?.length || 0;
                            importedFloors++;
                        }
                    }
                }
                
                alert(`Successfully imported ${importedSeats} seat(s) from ${importedFloors} floor(s).`);
                
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error reading file. Please ensure it is a valid JSON file.');
            }
        };
        
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsText(file);
    }
    
    // Validate imported data structure
    validateImportData(data) {
        // Check basic structure
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Check for seat mappings
        if (!data.seatMappings || typeof data.seatMappings !== 'object') {
            return false;
        }
        
        // Validate seat data structure for each floor
        for (const floorId in data.seatMappings) {
            const floorData = data.seatMappings[floorId];
            if (!floorData || !Array.isArray(floorData.seats)) {
                return false;
            }
            
            // Validate each seat
            for (const seat of floorData.seats) {
                if (typeof seat.number !== 'number' ||
                    typeof seat.normalizedX !== 'number' ||
                    typeof seat.normalizedY !== 'number') {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Import seat mappings from validated data
    importSeatMappings(importData) {
        // Process each floor in the import data
        for (const floorId in importData.seatMappings) {
            // Only import if the floor exists in current configuration
            if (this.floorData[floorId]) {
                const importFloorData = importData.seatMappings[floorId];
                
                // Replace floor data
                this.floorData[floorId] = {
                    seats: importFloorData.seats.map(seat => ({
                        number: seat.number,
                        normalizedX: seat.normalizedX,
                        normalizedY: seat.normalizedY,
                        displayX: 0, // Will be calculated when markers are updated
                        displayY: 0
                    })),
                    nextSeatNumber: importFloorData.nextSeatNumber || 
                        (importFloorData.seats.length > 0 
                            ? Math.max(...importFloorData.seats.map(s => s.number)) + 1 
                            : 1)
                };
            } else {
                console.warn(`Floor "${floorId}" in import file does not exist in current configuration. Skipping.`);
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Expose globally for booking cancel buttons
    window.seatMapper = new SeatMapper();
});
