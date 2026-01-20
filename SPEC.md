# Work Area Booking System - Floor Mapping Specification

## Overview
A web application for mapping and booking work areas (seats) in an office building with multiple floors.

## Phase 1: Floor Mapping Feature

### ✅ Implemented Requirements

#### 1. Floor Plan Display ✅
- ✅ Display the floor plan image (e.g., `floor_15.jpg`, `floor_plan_18th.png`) in the browser
- ✅ **PDF Support**: Can also display PDF floor plans (e.g., `floor_plan_18th.pdf`)
  - Uses PDF.js library for rendering
  - Renders first page of PDF to canvas at 2x resolution for high DPI displays
  - Automatically detects file type from extension
- ✅ Image/PDF displayed at a reasonable size with ability to see details
- ✅ Maintains aspect ratio
- ✅ Responsive layout that adapts to window resizing

#### 2. Interactive Seat Mapping ✅
- ✅ **Click Detection**: Users can click anywhere on the floor plan image to mark a seat location
- ✅ **Visual Markers**: Each clicked location displays:
  - A small circle marker (5px radius)
  - A sequential number inside the circle (starting from 1, incrementing with each click)
  - White stroke for visibility
- ✅ **Coordinate Tracking**: Stores click coordinates relative to the natural image dimensions
- ✅ **Marker Removal**: Right-click on a marker or near a marker (within 5px) to remove it
- ✅ **Auto-renumbering**: When a marker is removed, remaining markers are automatically renumbered

#### 3. Seat List Management ✅
- ✅ **Dynamic List**: Maintains a list of all mapped seats showing:
  - Seat number (sequential)
  - Normalized location coordinates (x, y in 0-1 range relative to natural image size)
- ✅ **List Display**: Displays this list in the UI, updating in real-time as seats are added/removed
- ✅ **List Format**: Each entry shows seat number and normalized coordinates
- ✅ **Scrollable List**: List scrolls when it grows, with always-visible scrollbar to prevent layout shifts
- ✅ **Empty State**: Shows helpful message when no seats are mapped

#### 4. Console Output ✅
- ✅ **Export Button**: A button in the UI labeled "Export to Console"
- ✅ **Button State**: Button is disabled when no seats are mapped
- ✅ **Output Format**: When clicked, outputs the complete seat list to browser console in multiple formats:
  - Formatted summary with total count
  - Array of seat objects
  - JSON string format
- ✅ **Data Structure**: Each seat object includes:
  - `seatNumber`: Sequential seat number
  - `location`: Object with `normalizedX` and `normalizedY` (0-1 range)
  - `displayCoordinates`: Current pixel coordinates (for reference)

#### 5. Zoom Functionality ✅
- ✅ **Zoom Controls**: 
  - Zoom In button (+)
  - Zoom Out button (-)
  - Reset Zoom button (🔍)
  - Update Markers button (⟳) - manually refreshes marker overlay
  - Current zoom level display (percentage)
- ✅ **Zoom Range**: 50% to 300% (0.5x to 3.0x)
- ✅ **Zoom Step**: 10% increments
- ✅ **Mouse Wheel Zoom**: Scroll wheel on the floor plan to zoom in/out
- ✅ **Transform Origin**: Zoom originates from top-left for consistent positioning
- ✅ **Coordinate Handling**: Coordinates remain accurate at all zoom levels
- ✅ **Marker Alignment**: Markers stay correctly aligned with the floor plan when zooming
- ✅ **Smooth Updates**: Overlay and markers update smoothly when zoom changes

#### 6. Snap Grid ✅
- ✅ **Grid Toggle**: Button to enable/disable snap grid overlay
- ✅ **Visual Grid**: Displays a visual grid overlay on the floor plan when enabled
  - Grid lines rendered as SVG for crisp display at any zoom level
  - Semi-transparent lines that don't obstruct the floor plan
- ✅ **Snap Behavior**: When enabled, marker positions snap to nearest grid intersection
  - Snapping occurs when a seat is added
  - Existing markers can be kept at their original positions
- ✅ **Grid Size Control**: 
  - Configurable grid cell size (default: 20px)
  - Increase/decrease grid size buttons
  - Current grid size display
- ✅ **Grid Styling**:
  - Light gray grid lines
  - Subtle appearance that doesn't interfere with floor plan visibility

#### 7. Multiple Floor Support ✅
- ✅ **Floor Configuration**: Define multiple floors with their floor plan files
  - Each floor has a name/label and associated floor plan file
  - Supports both image and PDF floor plans per floor
- ✅ **Floor Selector**: Dropdown or tab interface to switch between floors
  - Shows current floor name
  - Easy navigation between floors
- ✅ **Per-Floor Seat Data**: Each floor maintains its own seat mappings
  - Seats are stored separately per floor
  - Switching floors loads that floor's seats
- ✅ **Floor State Persistence**: 
  - Seat mappings preserved when switching floors
  - All floor data available for export
- ✅ **Export Options**:
  - Export current floor's seats
  - Export all floors' seats together

#### 8. LocalStorage Persistence ✅
- ✅ **Auto-Save**: Seat mappings automatically saved to localStorage when:
  - A new seat is added
  - A seat is removed
  - Seats are renumbered
- ✅ **Auto-Load**: Seat mappings automatically restored from localStorage on page load
- ✅ **Per-Floor Storage**: Each floor's seat data saved under a unique key
- ✅ **Data Integrity**: Graceful handling of corrupted or missing data
- ✅ **Clear Data**: Option to clear all saved mappings (via console or export functionality)

#### 9. JSON File Export/Import ✅
- ✅ **Export to JSON File**: Download seat mappings as a JSON file
  - Exports all floors' data in a single file
  - Includes metadata (export date, floor configuration)
  - Human-readable formatted JSON
- ✅ **Import from JSON File**: Load seat mappings from a JSON file
  - File picker dialog for selecting JSON files
  - Validates file format before importing
  - Merges or replaces existing data (with confirmation)
  - Handles missing floors gracefully
- ✅ **Auto-Load from Default File**: Automatically load `seat-mappings.json` on startup
  - Attempts to fetch `seat-mappings.json` from the application root
  - Silently skips if file doesn't exist (no error shown)
  - Only loads if no localStorage data exists (localStorage takes priority)
  - Useful for pre-configured deployments or shared default mappings

#### 10. Drag to Reposition Markers ✅
- ✅ **Drag Functionality**: Click and drag markers to reposition them
  - Works with mouse drag on desktop
  - Visual feedback during drag (cursor change, marker highlight)
- ✅ **Snap to Grid**: Dragged markers snap to grid when snap grid is enabled
- ✅ **Boundary Constraints**: Markers cannot be dragged outside the floor plan
- ✅ **Auto-Save**: Position changes automatically saved to localStorage
- ✅ **Zoom Compatible**: Drag works correctly at any zoom level

#### 11. Seat Booking Functionality ✅
- ✅ **Dedicated Booking Page**: Separate `booking.html` page for all booking operations
  - Mapping page (`index.html`) focuses on admin seat mapping
  - Booking page provides user-friendly interface for reservations
  - Navigation link between pages
- ✅ **Multi-Seat Selection**: Select multiple seats at once via rectangular area selection
  - Click and drag to draw a selection rectangle
  - All available seats within the rectangle are selected
  - Visual preview of seats that will be selected while dragging
  - Yellow highlight for selected seats
  - Selection chips in sidebar showing selected seat numbers
  - Book all selected seats with one click
- ✅ **User Identity**: Simple username input for identifying bookings
  - Username persisted in localStorage
  - Required before booking
- ✅ **Date Selection**: Book seats for specific dates
  - Date picker defaulting to today
  - View bookings for any date
- ✅ **Seat Status Visual Indicators**:
  - Available seats: Green markers
  - Booked by others: Red markers (shows booker name on hover)
  - Your bookings: Blue markers
  - Selected seats: Yellow markers (pending booking)
- ✅ **Booking Actions**:
  - Click available seat to toggle selection
  - Drag to select multiple seats at once
  - Book all selected seats with "Book Selected" button
  - Click your booking to cancel it
  - Cannot modify others' bookings
- ✅ **Booking Summary Panel**: Shows your bookings for selected date
- ✅ **Booking Persistence**: All bookings saved to localStorage
- ✅ **Multi-floor Support**: Bookings tracked per floor

#### 12. Microsoft Entra ID Authentication ✅
- ✅ **Automatic Sign-In**: Users are automatically authenticated via Microsoft Entra ID
  - Redirects to Microsoft login if not authenticated
  - Seamless single sign-on for users already logged into Microsoft services
- ✅ **User Identity from Token**: Username automatically populated from Entra ID
  - No manual username entry required
  - Uses user's display name from Microsoft account
  - Email available as fallback identifier
- ✅ **Session Management**: 
  - Authentication state cached in sessionStorage
  - Sign-out button to clear session and log out
- ✅ **Mock Login Mode**: When Entra ID is not configured, provides a simple login experience
  - Modal dialog prompts for username
  - Shows authenticated-style display with sign-out option
  - Username persisted in localStorage between sessions
- ✅ **Graceful Fallback**: If authentication fails, falls back to mock login
- ✅ **MSAL.js Integration**: Uses Microsoft Authentication Library (MSAL) for browser
  - Handles redirect-based authentication flow
  - Automatic token management and refresh
- ✅ **Configuration**: Easy setup via `auth-config.js`
  - Client ID and Tenant ID configurable
  - Redirect URI auto-detected from current location
  - Works without configuration (uses mock login mode)

#### 13. Firebase Cloud Storage ✅
- ✅ **Cloud Persistence**: Store seat mappings and bookings in Firebase Realtime Database
  - Enables data sharing across multiple devices and users
  - Real-time synchronization of booking data
  - Survives browser data clears and device changes
- ✅ **Dual Storage Mode**: Supports both localStorage and Firebase
  - localStorage: Default, works offline, per-device storage
  - Firebase: Optional, cloud-based, shared across all users
  - Configurable via `firebase-config.js`
- ✅ **Data Structure**:
  - `/seatMappings/{floorId}`: Seat positions for each floor
  - `/bookings/{date}/{floorId}/{seatNumber}`: Booking records
- ✅ **Graceful Fallback**: If Firebase is not configured or unavailable, falls back to localStorage
- ✅ **No Authentication Required**: Current implementation uses public Firebase rules (future enhancement: Firebase Auth)
- ✅ **Configuration**: Easy setup via `firebase-config.js`
  - Firebase project credentials
  - Database URL
  - Enable/disable Firebase storage

### Technical Implementation

#### Coordinate System ✅
- ✅ **Normalized Coordinates**: Coordinates stored as normalized values (0-1 range) relative to base displayed size
- ✅ **Base Displayed Size**: Uses `offsetWidth`/`offsetHeight` (actual rendered size at 100% zoom before transforms)
  - Accounts for CSS constraints like `max-width: 100%` that may make displayed size smaller than natural size
- ✅ **Zoom Handling**: Coordinates are converted from displayed coordinates (at current zoom) to normalized coordinates
- ✅ **Consistency**: Normalized coordinates ensure markers appear in the correct location regardless of zoom level
- ✅ **Conversion Logic**:
  - On click: Displayed coordinates → Base coordinates (÷ zoom) → Normalized (0-1)
  - On render: Normalized (0-1) → Base coordinates → Container scales to displayed position

#### Marker Rendering ✅
- ✅ **SVG Overlay**: Uses SVG overlay positioned absolutely over the image
- ✅ **Dynamic Positioning**: Overlay position updates to match image position (accounts for centering and zoom)
- ✅ **Marker Styling**: 
  - Circle radius: 5px
  - Fill color: #667eea (purple)
  - White stroke: 1px width
  - Bold white text for numbers
- ✅ **Interactive Markers**: Markers are clickable for removal via right-click
- ✅ **Real-time Updates**: Markers update immediately when seats are added/removed

#### Data Persistence ✅
- ✅ **localStorage**: Default storage for seat mappings and bookings (per-device)
- ✅ **Firebase Realtime Database**: Optional cloud storage for shared data across users/devices
- ✅ **Automatic Sync**: Data automatically saved when changes occur
- ✅ **Configurable**: Switch between localStorage and Firebase via configuration

#### UI Layout ✅
- ✅ **Layout**: Left/Right split layout
  - Left: Image display area (larger, flexible width)
  - Right: Seat list panel (fixed 350px width)
- ✅ **Zoom Controls**: Positioned above the image container
- ✅ **Responsive Design**: Layout adapts to window resizing
- ✅ **Fixed Sidebar**: Sidebar width is fixed to prevent layout shifts when scrollbar appears
- ✅ **Modern Styling**: Clean, modern UI with gradient header and card-based design

### Implementation Details

#### Files Structure
- `index.html`: Seat mapping page (admin) with PDF.js library
- `booking.html`: Seat booking page (user) with multi-select support and Entra ID auth
- `styles.css`: Complete styling with modern design (shared)
- `booking.css`: Booking page specific styles (selection rectangle, chips, auth UI, etc.)
- `app.js`: Seat mapping application logic (SeatMapper class)
- `booking.js`: Seat booking application logic (SeatBooking class)
- `auth.js`: Microsoft Entra ID authentication module (AuthManager class)
- `auth-config.js`: Authentication configuration (client ID, tenant ID)
- `firebase-config.js`: Firebase project configuration (API key, database URL)
- `firebase-storage.js`: Firebase storage module (FirebaseStorage class)
- Floor plan files (configurable in both `app.js` and `booking.js`):
  - Supports: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.pdf`
  - Examples: `floor_15.jpg`, `floor_plan_18th.png`, `floor_plan_18th.pdf`

#### Key Features
1. **Event Handling**: Proper event listeners for clicks, right-clicks, and mouse wheel
2. **Floor Plan Loading**: 
   - Handles cached images and load errors gracefully
   - PDF rendering via PDF.js library
   - Automatic format detection
3. **Window Resize**: Updates overlay and markers on window resize
4. **Zoom Transform**: Uses CSS transform scale with top-left origin for smooth, consistent zooming
5. **Coordinate Math**: Accurate coordinate conversion using base displayed size (accounts for CSS constraints)
6. **Manual Refresh**: Update Markers button to manually refresh overlay positioning

### Browser Compatibility
- ✅ Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ External dependency: PDF.js (loaded from CDN for PDF support)
- ✅ External dependency: MSAL.js (loaded from CDN for Entra ID authentication)
- ✅ External dependency: Firebase SDK (loaded from CDN for cloud storage)
- ⚠️ **Note**: PDF files require serving via HTTP server (not `file://` protocol) due to CORS restrictions
- ⚠️ **Note**: Entra ID authentication requires HTTPS in production (localhost allowed for development)
- ⚠️ **Note**: Firebase requires internet connection for cloud storage features

### Future Enhancements (Not Yet Implemented)
- ⏳ Seat name/description editing
- ⏳ Undo/redo functionality
- ⏳ Firebase Authentication integration for secure database access