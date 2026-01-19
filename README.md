# Work Area Booking System

A web application for mapping and booking work areas (seats) in an office building with multiple floors.

## Features

### Floor Plan Mapping
- **Interactive Floor Plans**: Click on the floor plan to mark seat locations
- **Visual Markers**: Each seat is marked with a numbered circle
- **Drag to Reposition**: Click and drag markers to move them
- **Seat List**: Real-time list showing all mapped seats with their coordinates
- **Right-click to Remove**: Right-click on or near a marker to remove it

### Multiple Floor Support
- **Floor Selector**: Dropdown to switch between different floors
- **Per-Floor Data**: Each floor maintains its own seat mappings
- **Easy Configuration**: Add floors by editing the `floors` array in `app.js`

### Zoom Controls
- **Zoom In/Out**: Buttons or mouse wheel to zoom the floor plan
- **Reset Zoom**: Return to 100% view
- **Update Markers**: Manually refresh marker positions after zooming

### Snap Grid
- **Toggle Grid**: Enable/disable a visual grid overlay
- **Adjustable Grid Size**: Increase or decrease grid cell size
- **Precision Placement**: Markers snap to grid intersections when enabled

### Data Persistence
- **Auto-Save**: Seat mappings automatically saved to localStorage
- **Auto-Load**: Mappings restored when you return to the page
- **Default Mappings**: Automatically loads from `seat-mappings.json` if present (when no localStorage data exists)
- **Clear All Data**: Option to reset all mappings across all floors

### Export Options
- **Export Current Floor**: Output current floor's seat data to console
- **Export All Floors**: Output all floors' seat data to console
- **Save to File**: Download all seat mappings as a JSON file
- **Load from File**: Import seat mappings from a JSON file

### File Format Support
- **Images**: JPG, PNG, GIF, WebP
- **PDF**: PDF floor plans (requires HTTP server, not `file://` protocol)

## Usage

1. Open `index.html` in a web browser (use a local server for PDF support)
2. Select a floor from the dropdown
3. Click anywhere on the floor plan to add a seat marker
4. Drag a marker to reposition it
5. Right-click on or near a marker to remove it
6. Use zoom controls or mouse wheel to zoom in/out
7. Toggle snap grid for precise marker placement
8. View the seat list in the right panel
8. Click export buttons to output mapping data (open DevTools with F12 to view)
9. Use "Save to File" to download mappings as JSON for backup or sharing
10. Use "Load from File" to import mappings from a previously saved JSON file

## Configuration

### Adding/Modifying Floors

Edit the `floors` array in `app.js`:

```javascript
this.floors = [
    { id: 'floor_14', name: 'Floor 14', file: 'floor_plan_14th.png' },
    { id: 'floor_15', name: 'Floor 15', file: 'floor_plan_15th.png' },
    { id: 'floor_18', name: 'Floor 18', file: 'floor_plan_18th.png' }
];
```

Each floor requires:
- `id`: Unique identifier (used for data storage)
- `name`: Display name shown in the UI
- `file`: Floor plan file path (image or PDF)

### Default Seat Mappings

To provide default seat mappings, create a `seat-mappings.json` file in the application root. This file will be automatically loaded on startup if no localStorage data exists.

You can create this file by:
1. Mapping seats manually in the application
2. Clicking "Save to File" to download the mappings
3. Renaming the downloaded file to `seat-mappings.json`
4. Placing it in the same directory as `index.html`

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - Application logic
- `SPEC.md` - Detailed specification
- `floor_plan_*.png/jpg/pdf` - Floor plan files
- `seat-mappings.json` - (Optional) Default seat mappings, auto-loaded on startup

## Technical Details

- **Normalized Coordinates**: Uses 0-1 range for consistency across screen sizes and zoom levels
- **SVG Overlay**: Markers rendered in SVG for quality at any zoom level
- **CSS Transform Zoom**: Smooth zooming with proper coordinate handling
- **LocalStorage**: Persistent data storage across browser sessions
- **PDF.js**: External library (CDN) for PDF rendering

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

**Note**: PDF files require serving via HTTP server (not `file://` protocol) due to CORS restrictions. Use a local development server like:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

Then open `http://localhost:8000` in your browser.
