# Work Area Booking System - Floor Mapping Specification

## Overview
A web application for mapping and booking work areas (seats) in an office building with multiple floors.

## Phase 1: Floor Mapping Feature

### ✅ Implemented Requirements

#### 1. Floor Plan Display ✅
- ✅ Display the floor plan image (e.g., `floor_15.jpg`) in the browser
- ✅ Image displayed at a reasonable size with ability to see details
- ✅ Image maintains aspect ratio
- ✅ Image is centered within its container
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
  - Reset Zoom button (⌂)
  - Current zoom level display (percentage)
- ✅ **Zoom Range**: 50% to 300% (0.5x to 3.0x)
- ✅ **Zoom Step**: 10% increments
- ✅ **Mouse Wheel Zoom**: Scroll wheel on the floor plan to zoom in/out
- ✅ **Coordinate Handling**: Coordinates remain accurate at all zoom levels
- ✅ **Marker Alignment**: Markers stay correctly aligned with the floor plan when zooming
- ✅ **Smooth Updates**: Overlay and markers update smoothly when zoom changes

### Technical Implementation

#### Coordinate System ✅
- ✅ **Normalized Coordinates**: Coordinates stored as normalized values (0-1 range) relative to natural image dimensions
- ✅ **Zoom Handling**: Coordinates are converted from displayed coordinates (at current zoom) to normalized coordinates
- ✅ **Consistency**: Normalized coordinates ensure markers appear in the correct location regardless of zoom level
- ✅ **Conversion Logic**:
  - On click: Displayed coordinates → Natural coordinates → Normalized (0-1)
  - On render: Normalized (0-1) → Natural coordinates → Displayed coordinates (at current zoom)

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

#### Data Persistence
- ✅ **Current**: Store in memory only (lost on page refresh)
- ⏳ **Future**: Save to localStorage or backend

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
- `index.html`: Main HTML structure
- `styles.css`: Complete styling with modern design
- `app.js`: Full application logic (SeatMapper class)
- `floor_15.jpg`: Floor plan image

#### Key Features
1. **Event Handling**: Proper event listeners for clicks, right-clicks, and mouse wheel
2. **Image Loading**: Handles cached images and load errors gracefully
3. **Window Resize**: Updates overlay and markers on window resize
4. **Zoom Transform**: Uses CSS transform scale for smooth zooming
5. **Coordinate Math**: Accurate coordinate conversion accounting for zoom, centering, and transforms

### Browser Compatibility
- ✅ Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Uses standard web APIs (no external dependencies)

### Future Enhancements (Not Yet Implemented)
- ⏳ Multiple floor support
- ⏳ Save/load mappings from localStorage
- ⏳ Seat name/description editing
- ⏳ Seat booking functionality
- ⏳ Export to file (JSON/CSV)
- ⏳ Undo/redo functionality
- ⏳ Drag to reposition markers
