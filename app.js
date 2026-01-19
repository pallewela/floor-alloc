// Seat mapping application
class SeatMapper {
    constructor() {
        this.seats = [];
        this.nextSeatNumber = 1;
        this.image = document.getElementById('floorImage');
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
        
        // Zoom state
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomStep = 0.1;
        
        this.init();
    }
    
    init() {
        // Check if image is already loaded (cached images)
        if (this.image.complete && this.image.naturalHeight !== 0) {
            this.setupEventListeners();
            this.updateOverlaySize();
        } else {
            // Wait for image to load to get proper dimensions
            this.image.onload = () => {
                this.setupEventListeners();
                this.updateOverlaySize();
            };
            
            // Handle image load error
            this.image.onerror = () => {
                console.error('Failed to load floor plan image');
                alert('Error: Could not load floor plan image. Please check that floor_15.jpg exists.');
            };
        }
        
        // Fallback: set up listeners after a short delay in case image load event doesn't fire
        setTimeout(() => {
            if (!this.imageWrapper.hasAttribute('data-listeners-setup')) {
                this.setupEventListeners();
                this.updateOverlaySize();
                this.imageWrapper.setAttribute('data-listeners-setup', 'true');
            }
        }, 100);
        
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
            // Only process if click is on the image, wrapper, or container inner (not on markers)
            if (e.target === this.image || e.target === this.imageWrapper || e.target === this.imageContainerInner) {
                this.addSeat(e);
            }
        });
        
        // Right click to remove seat
        this.imageWrapper.addEventListener('contextmenu', (e) => {
            // Only process if click is on the image, wrapper, or container inner (not on markers)
            if (e.target === this.image || e.target === this.imageWrapper || e.target === this.imageContainerInner) {
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
        const baseWidth = this.image.offsetWidth;
        const baseHeight = this.image.offsetHeight;
        
        // IMPORTANT: The overlay is inside imageContainerInner which has CSS transform scale applied
        // We need to set the overlay size to match the IMAGE's base size (not natural size)
        // The container's transform will scale both the image and overlay together
        this.markerOverlay.setAttribute('width', baseWidth);
        this.markerOverlay.setAttribute('height', baseHeight);
        
        // Set viewBox to match for proper coordinate system
        this.markerOverlay.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
        
        // Position overlay at same position as image within container
        // Both are direct children of imageContainerInner, so use offsetLeft/offsetTop
        this.markerOverlay.style.left = this.image.offsetLeft + 'px';
        this.markerOverlay.style.top = this.image.offsetTop + 'px';
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
    
    setZoom(newZoom) {
        // Clamp zoom value
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        
        // Apply zoom transform
        this.imageContainerInner.style.transform = `scale(${this.zoom})`;
        this.imageContainerInner.style.transformOrigin = 'center center';
        
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
        const imageRect = this.image.getBoundingClientRect();
        
        // Get click position relative to viewport
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // Calculate click position relative to the image's bounding rect
        // imageRect already accounts for zoom, centering, and transforms
        const x = clickX - imageRect.left;
        const y = clickY - imageRect.top;
        
        // Calculate actual displayed dimensions (zoomed)
        const displayedWidth = imageRect.width;
        const displayedHeight = imageRect.height;
        
        // Clamp coordinates to image bounds
        const clampedX = Math.max(0, Math.min(x, displayedWidth));
        const clampedY = Math.max(0, Math.min(y, displayedHeight));
        
        // Get the BASE displayed size of the image (before CSS transform)
        // This is the actual rendered size at 100% zoom
        const baseWidth = this.image.offsetWidth;
        const baseHeight = this.image.offsetHeight;
        
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
        
        const seat = {
            number: this.nextSeatNumber++,
            normalizedX: coords.normalizedX,
            normalizedY: coords.normalizedY,
            displayX: coords.displayX,
            displayY: coords.displayY
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
        
        // Update display coordinates based on current image size
        const rect = this.image.getBoundingClientRect();
        
        this.seats.forEach((seat) => {
            // Convert normalized coordinates (0-1) to overlay coordinates
            // IMPORTANT: The overlay uses the BASE displayed size (before CSS transform)
            // which may be smaller than natural size due to max-width/max-height constraints
            const baseWidth = this.image.offsetWidth;
            const baseHeight = this.image.offsetHeight;
            
            // Convert normalized to base displayed coordinates
            // Since the overlay matches the image's base size, we multiply by base dimensions
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
