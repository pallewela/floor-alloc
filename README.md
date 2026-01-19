# Work Area Booking System

A web application for mapping and booking work areas (seats) in an office building.

## Phase 1: Floor Mapping

### Features

- **Interactive Floor Plan**: Click on the floor plan image to mark seat locations
- **Visual Markers**: Each seat is marked with a numbered circle
- **Seat List**: Real-time list showing all mapped seats with their coordinates
- **Export to Console**: Button to export the seat mapping data to browser console

### Usage

1. Open `index.html` in a web browser
2. Click anywhere on the floor plan image to add a seat marker
3. Right-click on a marker to remove it
4. View the seat list in the right panel
5. Click "Export to Console" to output the mapping data (open DevTools with F12 to view)

### File Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - Application logic
- `floor_15.jpg` - Floor plan image
- `SPEC.md` - Detailed specification

### Technical Details

- Uses normalized coordinates (0-1 range) for consistency across screen sizes
- SVG overlay for markers to maintain quality at any zoom level
- Responsive design that adapts to window resizing
- Data stored in memory (lost on page refresh)

### Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
