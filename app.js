// Seat mapping application
class SeatMapper {
    constructor() {
        this.seats = [];
        this.nextSeatNumber = 1;
        
        // Floor plan source - change this to switch between image and PDF
        // Supported formats: .jpg, .jpeg, .png, .gif, .webp, .pdf
        this.floorPlanSource = 'floor_plan_18th.png';
        
        // DOM elements
        this.image = document.getElementById('floorImage');
        this.pdfCanvas = document.getElementById('pdfCanvas');
        this.imageWrapper = document.getElementById('imageWrapper');
        this.imageContainerInner = document.getElementById('imageContainerInner');
        this.markerOverlay = document.getElementById('markerOverlay');
        this.seatList = document.getElementById('seatList');
        this.exportBtn = document.getElementById('exportBtn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        this.updateOverlayBtn = document.getElementById('updateOverlayBtn');
        
        // Grid control elements
        this.gridToggleBtn = document.getElementById('gridToggleBtn');
        this.gridDecreaseBtn = document.getElementById('gridDecreaseBtn');
        this.gridIncreaseBtn = document.getElementById('gridIncreaseBtn');
        this.gridSizeDisplay = document.getElementById('gridSize');
        this.gridOverlay = document.getElementById('gridOverlay');
        
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
        this.gridSize = 20; // pixels
        this.minGridSize = 5;
        this.maxGridSize = 100;
        this.gridSizeStep = 5;
        
        this.init();
    }
    
    init() {
        // Determine if source is PDF or image
        this.isPDF = this.floorPlanSource.toLowerCase().endsWith('.pdf');
        
        if (this.isPDF) {
            // Load PDF
            this.loadPDF();
        } else {
            // Load image
            this.loadImage();
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateOverlaySize();
            this.updateMarkers();
        });
        
        // Export button
        this.exportBtn.addEventListener('click', () => {
            this.exportToConsole();
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
            circle.setAttribute('fill', '#667eea');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('class', 'marker-circle');
            circle.setAttribute('data-seat-number', seat.number);
            // Allow pointer events on circles for right-click removal
            circle.style.pointerEvents = 'all';
            
            // Add right-click handler to circle - use seat number to find and remove
            const seatNumber = seat.number;
            circle.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const seatIndex = this.seats.findIndex(s => s.number === seatNumber);
                if (seatIndex !== -1) {
                    this.seats.splice(seatIndex, 1);
                    this.renumberSeats();
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
        const exportData = this.seats.map(seat => ({
            seatNumber: seat.number,
            location: {
                normalizedX: parseFloat(seat.normalizedX.toFixed(6)),
                normalizedY: parseFloat(seat.normalizedY.toFixed(6))
            },
            displayCoordinates: {
                x: Math.round(seat.displayX),
                y: Math.round(seat.displayY)
            }
        }));
        
        console.log('=== Seat Mapping Export ===');
        console.log(`Total Seats: ${exportData.length}`);
        console.log('Seat Data:', exportData);
        console.log('JSON Format:', JSON.stringify(exportData, null, 2));
        console.log('========================');
        
        // Also show an alert for user feedback
        alert(`Exported ${exportData.length} seat(s) to console. Open browser DevTools (F12) to view.`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SeatMapper();
});
