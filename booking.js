// Seat Booking Application with Multi-Select
class SeatBooking {
    constructor() {
        // Storage keys
        this.STORAGE_KEY = 'workarea_booking_seat_mappings';
        this.BOOKINGS_STORAGE_KEY = 'workarea_booking_reservations';
        this.USERNAME_STORAGE_KEY = 'workarea_booking_username';
        
        // Floor configurations
        this.floors = [
            { id: 'floor_14', name: 'Floor 14', file: 'floor_plan_14th.png' },
            { id: 'floor_15', name: 'Floor 15', file: 'floor_plan_15th.png' },
            { id: 'floor_18', name: 'Floor 18', file: 'floor_plan_18th.png' }
        ];
        
        this.currentFloorId = this.floors[0].id;
        
        // Per-floor seat data
        this.floorData = {};
        this.initializeFloorData();
        
        // Bookings data
        this.bookings = {};
        
        // Selected seats for multi-booking
        this.selectedSeats = new Set();
        
        // Selection rectangle state
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        
        // Load data
        this.loadFromStorage();
        this.loadBookings();
        
        // DOM elements
        this.image = document.getElementById('floorImage');
        this.pdfCanvas = document.getElementById('pdfCanvas');
        this.imageWrapper = document.getElementById('imageWrapper');
        this.imageContainerInner = document.getElementById('imageContainerInner');
        this.markerOverlay = document.getElementById('markerOverlay');
        this.selectionRect = document.getElementById('selectionRect');
        this.selectionInfo = document.getElementById('selectionInfo');
        
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        this.floorSelect = document.getElementById('floorSelect');
        
        this.usernameInput = document.getElementById('usernameInput');
        this.bookingDate = document.getElementById('bookingDate');
        this.bookingList = document.getElementById('bookingList');
        this.bookingFloorBadge = document.getElementById('bookingFloorBadge');
        
        this.selectedSeatsList = document.getElementById('selectedSeatsList');
        this.bookSelectedBtn = document.getElementById('bookSelectedBtn');
        this.clearSelectionBtn = document.getElementById('clearSelectionBtn');
        
        // Floor plan element
        this.floorPlanElement = null;
        this.isPDF = false;
        
        // Zoom state
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomStep = 0.1;
        
        this.init();
    }
    
    get seats() {
        return this.floorData[this.currentFloorId]?.seats || [];
    }
    
    get currentFloor() {
        return this.floors.find(f => f.id === this.currentFloorId);
    }
    
    get floorPlanSource() {
        return this.currentFloor.file;
    }
    
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
    
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                this.floors.forEach(floor => {
                    if (parsed[floor.id]) {
                        this.floorData[floor.id] = {
                            seats: parsed[floor.id].seats || [],
                            nextSeatNumber: parsed[floor.id].nextSeatNumber || 1
                        };
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to load seat mappings:', error);
        }
    }
    
    loadBookings() {
        try {
            const savedBookings = localStorage.getItem(this.BOOKINGS_STORAGE_KEY);
            if (savedBookings) {
                this.bookings = JSON.parse(savedBookings);
            }
        } catch (error) {
            console.warn('Failed to load bookings:', error);
            this.bookings = {};
        }
    }
    
    saveBookings() {
        try {
            localStorage.setItem(this.BOOKINGS_STORAGE_KEY, JSON.stringify(this.bookings));
        } catch (error) {
            console.warn('Failed to save bookings:', error);
        }
    }
    
    saveUsername() {
        const username = this.usernameInput.value.trim();
        if (username) {
            localStorage.setItem(this.USERNAME_STORAGE_KEY, username);
        }
    }
    
    getUsername() {
        // Try to get username from auth manager first (Entra ID)
        if (authManager && authManager.isAuthenticated()) {
            const authName = authManager.getUserDisplayName();
            if (authName) return authName;
        }
        
        // Try manual input field (if visible and has value)
        const inputValue = this.usernameInput?.value?.trim();
        if (inputValue) return inputValue;
        
        // Fallback to mock username
        if (this.mockUsername) return this.mockUsername;
        
        return '';
    }
    
    getSelectedDate() {
        return this.bookingDate.value;
    }
    
    async init() {
        // Initialize authentication first
        await this.initializeAuth();
        
        // Try loading from default file if no localStorage data
        if (this.seats.length === 0) {
            await this.loadFromDefaultFile();
        }
        
        // Populate floor selector
        this.populateFloorSelector();
        
        // Initialize booking controls
        this.initializeBookingControls();
        
        // Load current floor
        this.loadCurrentFloor();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    async initializeAuth() {
        try {
            // Initialize the auth manager
            await authManager.initialize();
            
            // Check if auth is configured
            if (!authManager.isConfigured()) {
                console.log('[Booking] Auth not configured, using mock login');
                this.initializeMockAuth();
                return;
            }
            
            // Check if user is authenticated
            if (!authManager.isAuthenticated()) {
                // Redirect to sign in
                console.log('[Booking] User not authenticated, redirecting to sign in');
                await authManager.signIn();
                // Note: This will redirect, so code below won't execute
                return;
            }
            
            // User is authenticated - update UI
            this.updateAuthUserDisplay();
            
            // Set up sign out button
            const signOutBtn = document.getElementById('signOutBtn');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', () => this.handleSignOut());
            }
            
        } catch (error) {
            console.error('[Booking] Authentication failed:', error);
            // Fallback to mock login
            this.initializeMockAuth();
        }
    }
    
    initializeMockAuth() {
        // Check if user already has a saved username
        const savedUsername = localStorage.getItem(this.USERNAME_STORAGE_KEY);
        const allowChange = 'false'; //localStorage.getItem(this.USERNAME_STORAGE_KEY + '_allowChange');
        
        if (savedUsername) {
            // User already logged in before
            this.mockUsername = savedUsername;
            this.allowNameChange = allowChange === 'true';
            
            if (this.allowNameChange) {
                // Show the name field so user can change it
                this.showManualUsernameInput(true);
                if (this.usernameInput) {
                    this.usernameInput.value = savedUsername;
                }
            } else {
                // Show authenticated-style display
                this.showMockAuthenticatedUser(savedUsername);
            }
        } else {
            // Show mock login modal
            this.showMockLoginModal();
        }
    }
    
    updateAuthUserDisplay() {
        const userName = authManager.getUserDisplayName();
        const userEmail = authManager.getUserEmail();
        
        const authUserControl = document.getElementById('authUserControl');
        const manualUserControl = document.getElementById('manualUserControl');
        const userNameEl = document.getElementById('userName');
        
        if (userName) {
            // Show authenticated user display
            if (authUserControl) authUserControl.style.display = 'block';
            if (manualUserControl) manualUserControl.style.display = 'none';
            if (userNameEl) {
                userNameEl.textContent = userName;
                userNameEl.title = userEmail || userName;
            }
        } else {
            this.showManualUsernameInput();
        }
    }
    
    showManualUsernameInput(showNameField = true) {
        const authUserControl = document.getElementById('authUserControl');
        const manualUserControl = document.getElementById('manualUserControl');
        
        // Hide auth display
        if (authUserControl) authUserControl.style.display = 'none';
        
        // Show or hide manual input based on preference
        if (manualUserControl) {
            manualUserControl.style.display = showNameField ? 'block' : 'none';
        }
        
        // Load saved username from localStorage
        const savedUsername = localStorage.getItem(this.USERNAME_STORAGE_KEY);
        if (savedUsername && this.usernameInput) {
            this.usernameInput.value = savedUsername;
        }
    }
    
    showMockLoginModal() {
        const modal = document.getElementById('loginModalOverlay');
        const loginInput = document.getElementById('loginUsername');
        const loginBtn = document.getElementById('loginSubmitBtn');
        const allowChangeCheckbox = document.getElementById('allowNameChange');
        
        if (!modal) {
            // Fallback if modal not in DOM
            this.showManualUsernameInput(true);
            return;
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        // Pre-fill with saved username if exists
        const savedUsername = localStorage.getItem(this.USERNAME_STORAGE_KEY);
        if (savedUsername && loginInput) {
            loginInput.value = savedUsername;
            loginBtn.disabled = false;
        }
        
        // Load saved preference for showing name field
        const allowChange = localStorage.getItem(this.USERNAME_STORAGE_KEY + '_allowChange');
        if (allowChangeCheckbox && allowChange !== null) {
            allowChangeCheckbox.checked = allowChange === 'true';
        }
        
        // Enable/disable submit button based on input
        if (loginInput) {
            loginInput.addEventListener('input', () => {
                loginBtn.disabled = !loginInput.value.trim();
            });
            
            // Handle Enter key
            loginInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && loginInput.value.trim()) {
                    this.handleMockLogin();
                }
            });
            
            // Focus the input
            setTimeout(() => loginInput.focus(), 100);
        }
        
        // Handle submit button
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleMockLogin());
        }
    }
    
    handleMockLogin() {
        const modal = document.getElementById('loginModalOverlay');
        const loginInput = document.getElementById('loginUsername');
        const allowChangeCheckbox = document.getElementById('allowNameChange');
        
        const username = loginInput?.value?.trim();
        if (!username) return;
        
        // Save username
        localStorage.setItem(this.USERNAME_STORAGE_KEY, username);
        
        // Save preference for showing name field
        const allowChange = allowChangeCheckbox?.checked ?? false;
        localStorage.setItem(this.USERNAME_STORAGE_KEY + '_allowChange', allowChange.toString());
        
        // Store in memory for mock auth
        this.mockUsername = username;
        this.allowNameChange = allowChange;
        
        // Hide modal
        if (modal) modal.style.display = 'none';
        
        // Update UI - show mock authenticated state or manual input based on preference
        if (allowChange) {
            this.showManualUsernameInput(true);
            // Set the username in the manual input
            if (this.usernameInput) {
                this.usernameInput.value = username;
            }
        } else {
            this.showMockAuthenticatedUser(username);
        }
        
        // Continue with app initialization
        this.updateUI();
    }
    
    showMockAuthenticatedUser(username) {
        const authUserControl = document.getElementById('authUserControl');
        const manualUserControl = document.getElementById('manualUserControl');
        const userNameEl = document.getElementById('userName');
        const signOutBtn = document.getElementById('signOutBtn');
        
        // Show auth-style display with mock user
        if (authUserControl) authUserControl.style.display = 'block';
        if (manualUserControl) manualUserControl.style.display = 'none';
        if (userNameEl) {
            userNameEl.textContent = username;
            userNameEl.title = 'Signed in as ' + username;
        }
        
        // Update sign out to show mock login again
        if (signOutBtn) {
            signOutBtn.onclick = () => this.handleMockSignOut();
        }
    }
    
    handleMockSignOut() {
        // Clear stored data
        localStorage.removeItem(this.USERNAME_STORAGE_KEY);
        localStorage.removeItem(this.USERNAME_STORAGE_KEY + '_allowChange');
        this.mockUsername = null;
        
        // Show login modal again
        this.showMockLoginModal();
    }
    
    async handleSignOut() {
        try {
            await authManager.signOut();
        } catch (error) {
            console.error('[Booking] Sign out failed:', error);
        }
    }
    
    async loadFromDefaultFile() {
        try {
            const response = await fetch('seat-mappings.json');
            if (!response.ok) return;
            
            const importData = await response.json();
            if (importData.seatMappings) {
                for (const floorId in importData.seatMappings) {
                    if (this.floorData[floorId]) {
                        const data = importData.seatMappings[floorId];
                        this.floorData[floorId] = {
                            seats: data.seats.map(s => ({
                                number: s.number,
                                normalizedX: s.normalizedX,
                                normalizedY: s.normalizedY,
                                displayX: 0,
                                displayY: 0
                            })),
                            nextSeatNumber: data.nextSeatNumber || 1
                        };
                    }
                }
            }
        } catch (error) {
            // Silently fail
        }
    }
    
    initializeBookingControls() {
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        this.bookingDate.value = today;
        
        // Load saved username
        const savedUsername = localStorage.getItem(this.USERNAME_STORAGE_KEY);
        if (savedUsername) {
            this.usernameInput.value = savedUsername;
        }
    }
    
    populateFloorSelector() {
        this.floorSelect.innerHTML = '';
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
        this.isPDF = this.floorPlanSource.toLowerCase().endsWith('.pdf');
        
        // Clear selection when switching floors
        this.clearSelection();
        
        // Reset zoom
        this.zoom = 1.0;
        this.imageContainerInner.style.transform = `scale(${this.zoom})`;
        this.zoomLevelDisplay.textContent = '100%';
        
        if (this.isPDF) {
            this.loadPDF();
        } else {
            this.loadImage();
        }
    }
    
    loadImage() {
        this.floorPlanElement = this.image;
        this.image.style.display = 'block';
        this.pdfCanvas.style.display = 'none';
        this.image.src = this.floorPlanSource;
        
        if (this.image.complete && this.image.naturalHeight !== 0) {
            this.onFloorPlanLoaded();
        } else {
            this.image.onload = () => this.onFloorPlanLoaded();
            this.image.onerror = () => {
                console.error('Failed to load floor plan image');
                alert(`Error: Could not load floor plan image.`);
            };
        }
    }
    
    async loadPDF() {
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            const loadingTask = pdfjsLib.getDocument(this.floorPlanSource);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            
            const scale = 2;
            const viewport = page.getViewport({ scale });
            
            this.pdfCanvas.width = viewport.width;
            this.pdfCanvas.height = viewport.height;
            this.pdfCanvas.style.width = (viewport.width / scale) + 'px';
            this.pdfCanvas.style.height = (viewport.height / scale) + 'px';
            
            const context = this.pdfCanvas.getContext('2d');
            await page.render({ canvasContext: context, viewport }).promise;
            
            this.pdfCanvas.style.display = 'block';
            this.image.style.display = 'none';
            this.floorPlanElement = this.pdfCanvas;
            this.pdfCanvas.naturalWidth = viewport.width / scale;
            this.pdfCanvas.naturalHeight = viewport.height / scale;
            
            this.onFloorPlanLoaded();
        } catch (error) {
            console.error('Failed to load PDF:', error);
            alert(`Error: Could not load PDF.`);
        }
    }
    
    onFloorPlanLoaded() {
        this.updateOverlaySize();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Floor selector
        this.floorSelect.addEventListener('change', (e) => {
            this.currentFloorId = e.target.value;
            this.loadCurrentFloor();
        });
        
        // Zoom controls - disabled on booking page (kept for code compatibility)
        // Zoom is fixed at 100% for consistent booking experience
        // this.zoomInBtn.addEventListener('click', () => this.setZoom(this.zoom + this.zoomStep));
        // this.zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoom - this.zoomStep));
        // this.resetZoomBtn.addEventListener('click', () => this.setZoom(1.0));
        
        // Mouse wheel zoom - disabled on booking page
        // this.imageWrapper.addEventListener('wheel', (e) => {
        //     e.preventDefault();
        //     const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        //     this.setZoom(this.zoom + delta);
        // }, { passive: false });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.updateOverlaySize();
            this.updateMarkers();
        });
        
        // Booking date change
        this.bookingDate.addEventListener('change', () => this.updateUI());
        
        // Username change
        this.usernameInput.addEventListener('change', () => this.saveUsername());
        
        // Book selected seats
        this.bookSelectedBtn.addEventListener('click', () => this.bookSelectedSeats());
        
        // Clear selection
        this.clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        
        // Selection rectangle - mouse events on image wrapper
        this.imageWrapper.addEventListener('mousedown', (e) => this.onSelectionStart(e));
        document.addEventListener('mousemove', (e) => this.onSelectionMove(e));
        document.addEventListener('mouseup', (e) => this.onSelectionEnd(e));
    }
    
    // ==================== SELECTION RECTANGLE ====================
    
    onSelectionStart(e) {
        // Only start selection on left click and on the floor plan area
        if (e.button !== 0) return;
        
        // Check if clicking on a marker - if so, handle single click
        if (e.target.classList.contains('marker-circle')) {
            return; // Let marker click handler deal with it
        }
        
        // Prevent text selection
        e.preventDefault();
        
        this.isSelecting = true;
        
        // Get coordinates relative to the image container inner
        const rect = this.imageContainerInner.getBoundingClientRect();
        this.selectionStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.selectionEnd = { ...this.selectionStart };
        
        // Show selection rectangle
        this.updateSelectionRectangle();
        this.selectionRect.style.display = 'block';
    }
    
    onSelectionMove(e) {
        if (!this.isSelecting) return;
        
        e.preventDefault();
        
        const rect = this.imageContainerInner.getBoundingClientRect();
        this.selectionEnd = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.updateSelectionRectangle();
        this.highlightSeatsInSelection();
    }
    
    onSelectionEnd(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.selectionRect.style.display = 'none';
        
        // Check if this was a drag (not just a click)
        const dx = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const dy = Math.abs(this.selectionEnd.y - this.selectionStart.y);
        
        if (dx > 5 || dy > 5) {
            // This was a drag - select seats in rectangle
            this.selectSeatsInRectangle();
        }
        
        this.updateUI();
    }
    
    updateSelectionRectangle() {
        const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
        
        this.selectionRect.style.left = left + 'px';
        this.selectionRect.style.top = top + 'px';
        this.selectionRect.style.width = width + 'px';
        this.selectionRect.style.height = height + 'px';
    }
    
    highlightSeatsInSelection() {
        const selectionBounds = this.getSelectionBounds();
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        
        // Temporarily highlight seats that would be selected
        this.seats.forEach(seat => {
            const seatX = seat.normalizedX * baseWidth;
            const seatY = seat.normalizedY * baseHeight;
            
            const inSelection = this.isPointInBounds(seatX, seatY, selectionBounds);
            const isAvailable = !this.getBookingForSeat(this.currentFloorId, seat.number, this.getSelectedDate());
            
            const circle = this.markerOverlay.querySelector(`circle[data-seat-number="${seat.number}"]`);
            if (circle) {
                if (inSelection && isAvailable) {
                    circle.classList.add('selection-preview');
                } else {
                    circle.classList.remove('selection-preview');
                }
            }
        });
    }
    
    getSelectionBounds() {
        return {
            left: Math.min(this.selectionStart.x, this.selectionEnd.x),
            right: Math.max(this.selectionStart.x, this.selectionEnd.x),
            top: Math.min(this.selectionStart.y, this.selectionEnd.y),
            bottom: Math.max(this.selectionStart.y, this.selectionEnd.y)
        };
    }
    
    isPointInBounds(x, y, bounds) {
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }
    
    selectSeatsInRectangle() {
        const selectionBounds = this.getSelectionBounds();
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        const date = this.getSelectedDate();
        
        this.seats.forEach(seat => {
            const seatX = seat.normalizedX * baseWidth;
            const seatY = seat.normalizedY * baseHeight;
            
            if (this.isPointInBounds(seatX, seatY, selectionBounds)) {
                // Only select available seats
                const booking = this.getBookingForSeat(this.currentFloorId, seat.number, date);
                if (!booking) {
                    this.selectedSeats.add(seat.number);
                }
            }
        });
        
        // Remove preview classes
        this.markerOverlay.querySelectorAll('.selection-preview').forEach(el => {
            el.classList.remove('selection-preview');
        });
    }
    
    toggleSeatSelection(seatNumber) {
        if (this.selectedSeats.has(seatNumber)) {
            this.selectedSeats.delete(seatNumber);
        } else {
            // Only allow selecting available seats
            const booking = this.getBookingForSeat(this.currentFloorId, seatNumber, this.getSelectedDate());
            if (!booking) {
                this.selectedSeats.add(seatNumber);
            }
        }
        this.updateUI();
    }
    
    clearSelection() {
        this.selectedSeats.clear();
        this.updateUI();
    }
    
    // ==================== BOOKING ====================
    
    getBookingForSeat(floorId, seatNumber, date) {
        if (!this.bookings[date]) return null;
        if (!this.bookings[date][floorId]) return null;
        return this.bookings[date][floorId][seatNumber] || null;
    }
    
    bookSeat(seatNumber) {
        const username = this.getUsername();
        if (!username) {
            alert('Please enter your name before booking a seat.');
            this.usernameInput.focus();
            return false;
        }
        
        const date = this.getSelectedDate();
        const floorId = this.currentFloorId;
        
        if (!this.bookings[date]) {
            this.bookings[date] = {};
        }
        if (!this.bookings[date][floorId]) {
            this.bookings[date][floorId] = {};
        }
        
        if (this.bookings[date][floorId][seatNumber]) {
            return false; // Already booked
        }
        
        this.bookings[date][floorId][seatNumber] = {
            user: username,
            timestamp: new Date().toISOString()
        };
        
        return true;
    }
    
    bookSelectedSeats() {
        const username = this.getUsername();
        if (!username) {
            alert('Please enter your name before booking seats.');
            this.usernameInput.focus();
            return;
        }
        
        if (this.selectedSeats.size === 0) {
            alert('Please select at least one seat to book.');
            return;
        }
        
        let bookedCount = 0;
        this.selectedSeats.forEach(seatNumber => {
            if (this.bookSeat(seatNumber)) {
                bookedCount++;
            }
        });
        
        if (bookedCount > 0) {
            this.saveBookings();
            alert(`Successfully booked ${bookedCount} seat(s)!`);
        }
        
        this.clearSelection();
    }
    
    cancelBooking(seatNumber, floorId = null) {
        const date = this.getSelectedDate();
        floorId = floorId || this.currentFloorId;
        
        if (!this.bookings[date]?.[floorId]?.[seatNumber]) {
            return false;
        }
        
        const booking = this.bookings[date][floorId][seatNumber];
        const username = this.getUsername();
        
        if (booking.user !== username) {
            alert('You can only cancel your own bookings.');
            return false;
        }
        
        delete this.bookings[date][floorId][seatNumber];
        
        // Clean up empty objects
        if (Object.keys(this.bookings[date][floorId]).length === 0) {
            delete this.bookings[date][floorId];
        }
        if (Object.keys(this.bookings[date]).length === 0) {
            delete this.bookings[date];
        }
        
        this.saveBookings();
        this.updateUI();
        return true;
    }
    
    handleSeatClick(seatNumber) {
        const date = this.getSelectedDate();
        const booking = this.getBookingForSeat(this.currentFloorId, seatNumber, date);
        const username = this.getUsername();
        
        if (!booking) {
            // Seat is available - toggle selection
            this.toggleSeatSelection(seatNumber);
        } else if (booking.user === username) {
            // It's my booking - cancel it
            this.cancelBooking(seatNumber);
        } else {
            // It's someone else's booking
            alert(`This seat is booked by ${booking.user}`);
        }
    }
    
    getMyBookingsForDate(date) {
        const username = this.getUsername();
        const myBookings = [];
        
        if (!this.bookings[date]) return myBookings;
        
        for (const floorId in this.bookings[date]) {
            const floor = this.floors.find(f => f.id === floorId);
            if (!floor) continue;
            
            for (const seatNumber in this.bookings[date][floorId]) {
                const booking = this.bookings[date][floorId][seatNumber];
                if (booking.user === username) {
                    myBookings.push({
                        floorId,
                        floorName: floor.name,
                        seatNumber: parseInt(seatNumber),
                        timestamp: booking.timestamp
                    });
                }
            }
        }
        
        return myBookings.sort((a, b) => a.seatNumber - b.seatNumber);
    }
    
    // ==================== UI UPDATES ====================
    
    updateOverlaySize() {
        if (!this.floorPlanElement) return;
        
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        
        this.markerOverlay.setAttribute('width', baseWidth);
        this.markerOverlay.setAttribute('height', baseHeight);
        this.markerOverlay.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
        this.markerOverlay.style.left = this.floorPlanElement.offsetLeft + 'px';
        this.markerOverlay.style.top = this.floorPlanElement.offsetTop + 'px';
    }
    
    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.imageContainerInner.style.transform = `scale(${this.zoom})`;
        this.imageContainerInner.style.transformOrigin = 'top left';
        this.zoomLevelDisplay.textContent = Math.round(this.zoom * 100) + '%';
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.updateOverlaySize();
                this.updateMarkers();
            });
        });
    }
    
    updateMarkers() {
        if (!this.floorPlanElement) return;
        
        this.updateOverlaySize();
        this.markerOverlay.innerHTML = '';
        
        const baseWidth = this.floorPlanElement.offsetWidth;
        const baseHeight = this.floorPlanElement.offsetHeight;
        const date = this.getSelectedDate();
        const username = this.getUsername();
        
        this.seats.forEach(seat => {
            const baseX = seat.normalizedX * baseWidth;
            const baseY = seat.normalizedY * baseHeight;
            seat.displayX = baseX;
            seat.displayY = baseY;
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', baseX);
            circle.setAttribute('cy', baseY);
            circle.setAttribute('r', '5');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('data-seat-number', seat.number);
            circle.style.pointerEvents = 'all';
            
            const seatNumber = seat.number;
            const booking = this.getBookingForSeat(this.currentFloorId, seatNumber, date);
            const isSelected = this.selectedSeats.has(seatNumber);
            
            if (isSelected) {
                // Selected (awaiting booking)
                circle.setAttribute('fill', '#ffc107');
                circle.setAttribute('class', 'marker-circle seat-selected');
            } else if (!booking) {
                // Available
                circle.setAttribute('fill', '#28a745');
                circle.setAttribute('class', 'marker-circle seat-available');
            } else if (booking.user === username) {
                // My booking
                circle.setAttribute('fill', '#007bff');
                circle.setAttribute('class', 'marker-circle seat-my-booking');
            } else {
                // Booked by someone else
                circle.setAttribute('fill', '#dc3545');
                circle.setAttribute('class', 'marker-circle seat-booked');
            }
            
            // Click handler
            circle.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleSeatClick(seatNumber);
                }
            });
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', baseX);
            text.setAttribute('y', baseY);
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
        this.updateBookingSummary();
        this.updateSelectedSeatsList();
        this.updateSelectionButtons();
    }
    
    updateBookingSummary() {
        const date = this.getSelectedDate();
        const myBookings = this.getMyBookingsForDate(date);
        
        this.bookingFloorBadge.textContent = this.currentFloor.name;
        
        if (myBookings.length === 0) {
            this.bookingList.innerHTML = '<p class="empty-message">No bookings for this date.</p>';
            return;
        }
        
        this.bookingList.innerHTML = myBookings.map(booking => `
            <div class="booking-item" data-floor="${booking.floorId}" data-seat="${booking.seatNumber}">
                <div class="booking-item-info">
                    <span class="booking-seat-number">Seat #${booking.seatNumber}</span>
                    <span class="booking-floor-name">${booking.floorName}</span>
                </div>
                <button class="cancel-btn" data-seat="${booking.seatNumber}" data-floor="${booking.floorId}">Cancel</button>
            </div>
        `).join('');
        
        // Add click handlers for cancel buttons
        this.bookingList.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const seatNumber = parseInt(e.target.dataset.seat);
                const floorId = e.target.dataset.floor;
                this.cancelBooking(seatNumber, floorId);
            });
        });
    }
    
    updateSelectedSeatsList() {
        if (this.selectedSeats.size === 0) {
            this.selectedSeatsList.innerHTML = '<p class="empty-message">No seats selected. Click a seat or drag to select multiple.</p>';
            return;
        }
        
        const sortedSeats = Array.from(this.selectedSeats).sort((a, b) => a - b);
        
        this.selectedSeatsList.innerHTML = `
            <div class="selected-seats-grid">
                ${sortedSeats.map(seatNum => `
                    <span class="selected-seat-chip" data-seat="${seatNum}">
                        #${seatNum}
                        <button class="chip-remove" data-seat="${seatNum}">×</button>
                    </span>
                `).join('')}
            </div>
        `;
        
        // Add click handlers to remove individual seats
        this.selectedSeatsList.querySelectorAll('.chip-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const seatNumber = parseInt(e.target.dataset.seat);
                this.selectedSeats.delete(seatNumber);
                this.updateUI();
            });
        });
    }
    
    updateSelectionButtons() {
        const hasSelection = this.selectedSeats.size > 0;
        this.bookSelectedBtn.disabled = !hasSelection;
        this.clearSelectionBtn.disabled = !hasSelection;
        
        if (hasSelection) {
            this.bookSelectedBtn.textContent = `📅 Book ${this.selectedSeats.size} Seat${this.selectedSeats.size > 1 ? 's' : ''}`;
        } else {
            this.bookSelectedBtn.textContent = '📅 Book Selected';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.seatBooking = new SeatBooking();
});
