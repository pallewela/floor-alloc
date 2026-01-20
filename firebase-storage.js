// Firebase Storage Module
// Handles data persistence to Firebase Realtime Database

class FirebaseStorage {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.useFirebase = false;
    }

    /**
     * Initialize Firebase connection
     * @returns {Promise<boolean>} True if Firebase is ready, false if falling back to localStorage
     */
    async initialize() {
        if (this.initialized) {
            return this.useFirebase;
        }

        // Check if Firebase should be used
        if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
            console.log('Firebase not configured, using localStorage');
            this.initialized = true;
            this.useFirebase = false;
            return false;
        }

        try {
            // Check if Firebase SDK is loaded
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK not loaded, using localStorage');
                this.initialized = true;
                this.useFirebase = false;
                return false;
            }

            // Initialize Firebase app if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.database();
            this.initialized = true;
            this.useFirebase = true;
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            this.initialized = true;
            this.useFirebase = false;
            return false;
        }
    }

    /**
     * Check if Firebase storage is active
     * @returns {boolean}
     */
    isActive() {
        return this.useFirebase && this.db !== null;
    }

    // =====================
    // SEAT MAPPINGS
    // =====================

    /**
     * Save seat mappings for a floor
     * @param {string} floorId - Floor identifier
     * @param {Array} seats - Array of seat objects
     * @returns {Promise<boolean>}
     */
    async saveSeatMappings(floorId, seats) {
        if (!this.isActive()) {
            return this._saveToLocalStorage(`seatMap_${floorId}`, seats);
        }

        try {
            await this.db.ref(`seatMappings/${floorId}`).set(seats);
            return true;
        } catch (error) {
            console.error('Failed to save seat mappings to Firebase:', error);
            // Fallback to localStorage
            return this._saveToLocalStorage(`seatMap_${floorId}`, seats);
        }
    }

    /**
     * Load seat mappings for a floor
     * @param {string} floorId - Floor identifier
     * @returns {Promise<Array>} Array of seat objects
     */
    async loadSeatMappings(floorId) {
        if (!this.isActive()) {
            return this._loadFromLocalStorage(`seatMap_${floorId}`) || [];
        }

        try {
            const snapshot = await this.db.ref(`seatMappings/${floorId}`).once('value');
            const data = snapshot.val();
            return data || [];
        } catch (error) {
            console.error('Failed to load seat mappings from Firebase:', error);
            // Fallback to localStorage
            return this._loadFromLocalStorage(`seatMap_${floorId}`) || [];
        }
    }

    /**
     * Load all seat mappings for all floors
     * @returns {Promise<Object>} Object with floorId as keys
     */
    async loadAllSeatMappings() {
        if (!this.isActive()) {
            return this._loadAllFromLocalStorage('seatMap_');
        }

        try {
            const snapshot = await this.db.ref('seatMappings').once('value');
            const data = snapshot.val();
            return data || {};
        } catch (error) {
            console.error('Failed to load all seat mappings from Firebase:', error);
            return this._loadAllFromLocalStorage('seatMap_');
        }
    }

    // =====================
    // BOOKINGS
    // =====================

    /**
     * Save a booking
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} floorId - Floor identifier
     * @param {number} seatNumber - Seat number
     * @param {Object} booking - Booking object { username, timestamp }
     * @returns {Promise<boolean>}
     */
    async saveBooking(date, floorId, seatNumber, booking) {
        if (!this.isActive()) {
            return this._saveBookingToLocalStorage(date, floorId, seatNumber, booking);
        }

        try {
            await this.db.ref(`bookings/${date}/${floorId}/${seatNumber}`).set(booking);
            return true;
        } catch (error) {
            console.error('Failed to save booking to Firebase:', error);
            return this._saveBookingToLocalStorage(date, floorId, seatNumber, booking);
        }
    }

    /**
     * Remove a booking
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} floorId - Floor identifier
     * @param {number} seatNumber - Seat number
     * @returns {Promise<boolean>}
     */
    async removeBooking(date, floorId, seatNumber) {
        if (!this.isActive()) {
            return this._removeBookingFromLocalStorage(date, floorId, seatNumber);
        }

        try {
            await this.db.ref(`bookings/${date}/${floorId}/${seatNumber}`).remove();
            return true;
        } catch (error) {
            console.error('Failed to remove booking from Firebase:', error);
            return this._removeBookingFromLocalStorage(date, floorId, seatNumber);
        }
    }

    /**
     * Load all bookings for a date and floor
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} floorId - Floor identifier
     * @returns {Promise<Object>} Object with seatNumber as keys
     */
    async loadBookings(date, floorId) {
        if (!this.isActive()) {
            return this._loadBookingsFromLocalStorage(date, floorId);
        }

        try {
            const snapshot = await this.db.ref(`bookings/${date}/${floorId}`).once('value');
            const data = snapshot.val();
            return data || {};
        } catch (error) {
            console.error('Failed to load bookings from Firebase:', error);
            return this._loadBookingsFromLocalStorage(date, floorId);
        }
    }

    /**
     * Load all bookings for a specific user on a date across all floors
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} username - Username to filter by
     * @returns {Promise<Array>} Array of { floorId, seatNumber, booking }
     */
    async loadUserBookings(date, username) {
        if (!this.isActive()) {
            return this._loadUserBookingsFromLocalStorage(date, username);
        }

        try {
            const snapshot = await this.db.ref(`bookings/${date}`).once('value');
            const allFloors = snapshot.val() || {};
            const userBookings = [];

            for (const [floorId, seats] of Object.entries(allFloors)) {
                for (const [seatNumber, booking] of Object.entries(seats)) {
                    if (booking && booking.username === username) {
                        userBookings.push({ floorId, seatNumber: parseInt(seatNumber), booking });
                    }
                }
            }

            return userBookings;
        } catch (error) {
            console.error('Failed to load user bookings from Firebase:', error);
            return this._loadUserBookingsFromLocalStorage(date, username);
        }
    }

    // =====================
    // LOCALSTORAGE FALLBACKS
    // =====================

    _saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    _loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }

    _loadAllFromLocalStorage(prefix) {
        const result = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const id = key.replace(prefix, '');
                    result[id] = this._loadFromLocalStorage(key);
                }
            }
        } catch (error) {
            console.error('Failed to load all from localStorage:', error);
        }
        return result;
    }

    _getBookingsKey(date) {
        return `bookings_${date}`;
    }

    _saveBookingToLocalStorage(date, floorId, seatNumber, booking) {
        try {
            const key = this._getBookingsKey(date);
            const allBookings = this._loadFromLocalStorage(key) || {};
            
            if (!allBookings[floorId]) {
                allBookings[floorId] = {};
            }
            allBookings[floorId][seatNumber] = booking;
            
            return this._saveToLocalStorage(key, allBookings);
        } catch (error) {
            console.error('Failed to save booking to localStorage:', error);
            return false;
        }
    }

    _removeBookingFromLocalStorage(date, floorId, seatNumber) {
        try {
            const key = this._getBookingsKey(date);
            const allBookings = this._loadFromLocalStorage(key) || {};
            
            if (allBookings[floorId] && allBookings[floorId][seatNumber]) {
                delete allBookings[floorId][seatNumber];
                return this._saveToLocalStorage(key, allBookings);
            }
            return true;
        } catch (error) {
            console.error('Failed to remove booking from localStorage:', error);
            return false;
        }
    }

    _loadBookingsFromLocalStorage(date, floorId) {
        try {
            const key = this._getBookingsKey(date);
            const allBookings = this._loadFromLocalStorage(key) || {};
            return allBookings[floorId] || {};
        } catch (error) {
            console.error('Failed to load bookings from localStorage:', error);
            return {};
        }
    }

    _loadUserBookingsFromLocalStorage(date, username) {
        try {
            const key = this._getBookingsKey(date);
            const allBookings = this._loadFromLocalStorage(key) || {};
            const userBookings = [];

            for (const [floorId, seats] of Object.entries(allBookings)) {
                for (const [seatNumber, booking] of Object.entries(seats)) {
                    if (booking && booking.username === username) {
                        userBookings.push({ floorId, seatNumber: parseInt(seatNumber), booking });
                    }
                }
            }

            return userBookings;
        } catch (error) {
            console.error('Failed to load user bookings from localStorage:', error);
            return [];
        }
    }
}

// Global Firebase storage instance
const firebaseStorage = new FirebaseStorage();
