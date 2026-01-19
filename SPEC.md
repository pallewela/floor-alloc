# Work Area Booking System - Floor Mapping Specification

## Overview
A web application for mapping and booking work areas (seats) in an office building with multiple floors.

## Phase 1: Floor Mapping Feature

### Requirements

#### 1. Floor Plan Display
- Display the floor plan image (e.g., `floor_15.jpg`) in the browser
- Image should be displayed at a reasonable size with ability to see details
- Image should maintain aspect ratio

#### 2. Interactive Seat Mapping
- **Click Detection**: Users can click anywhere on the floor plan image to mark a seat location
- **Visual Markers**: Each clicked location should display:
  - A circle marker
  - A sequential number inside the circle (starting from 1, incrementing with each click)
- **Coordinate Tracking**: Store the click coordinates relative to the image

#### 3. Seat List Management
- **Dynamic List**: Maintain a list of all mapped seats showing:
  - Seat number (sequential)
  - Location coordinates (x, y relative to image)
- **List Display**: Display this list in the UI, updating in real-time as seats are added
- **List Format**: Each entry should show seat number and coordinates

#### 4. Console Output
- **Export Button**: A button in the UI labeled "Export to Console" or similar
- **Output Format**: When clicked, output the complete seat list to browser console
- **Data Structure**: Output should be clear and structured (e.g., JSON format or formatted list)

### Technical Considerations

#### Coordinate System
- Coordinates should be relative to the displayed image (not the original image dimensions)
- Need to handle image scaling/resizing
- Store both:
  - Display coordinates (for rendering markers)
  - Normalized coordinates (0-1 range) for consistency across different screen sizes

#### Marker Rendering
- Use SVG or Canvas overlay on top of the image
- Markers should be clickable/removable (future enhancement)
- Circle size should be appropriate for visibility

#### Data Persistence
- For Phase 1: Store in memory only (lost on page refresh)
- Future: Save to localStorage or backend

### UI Layout
- **Left/Right Split** or **Top/Bottom Split**:
  - Image display area (larger section)
  - Seat list panel (smaller section)
  - Export button (in the list panel or header)

### Questions for Clarification

1. **Coordinate System**: Should coordinates be:
   - Absolute pixel coordinates relative to the displayed image size?
   - Normalized coordinates (0-1) for consistency?
   - Both?

2. **Marker Removal**: Should users be able to remove/delete markers in Phase 1, or is that a future feature?

3. **Floor Selection**: Should Phase 1 support multiple floors, or just work with `floor_15.jpg` for now?

4. **List Format**: What information should be displayed in the list?
   - Just seat number and coordinates?
   - Should we include any other metadata (timestamp, etc.)?

5. **Console Output Format**: Preferred format for console output?
   - JSON array of objects?
   - Formatted table?
   - Simple list?

6. **Styling**: Any specific design preferences or should I create a clean, modern UI?

## Implementation Plan

1. Create HTML structure with image container and list panel
2. Implement image display with proper scaling
3. Add click event handlers to capture coordinates
4. Render markers (circles with numbers) at clicked positions
5. Maintain seat list data structure
6. Display seat list in UI
7. Add export button with console output functionality
8. Style the interface for a clean, modern look
