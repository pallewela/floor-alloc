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

### Seat Booking
- **Dedicated Booking Page**: Separate page for booking operations
- **Microsoft Entra ID Authentication**: Automatic user sign-in via Microsoft account (when configured)
- **Mock Login Mode**: Simple username prompt when Entra ID is not configured
  - Option to keep name field visible for easy changes
- **Multi-Seat Selection**: Click and drag to select multiple seats at once with rectangular selection
- **Date Selection**: Book seats for specific dates
- **Visual Status**: Seats show as green (available), red (booked by others), blue (your booking), or yellow (selected)
- **Batch Booking**: Select multiple seats and book them all with one click
- **User Identity**: Automatically populated from Entra ID or entered via mock login
- **Booking Summary**: View all your bookings for the selected date

## Usage

### Mapping Page (Admin)
1. Open `index.html` in a web browser (use a local server for PDF support)
2. Select a floor from the dropdown
3. Click anywhere on the floor plan to add a seat marker
4. Drag a marker to reposition it
5. Right-click on or near a marker to remove it
6. Use zoom controls or mouse wheel to zoom in/out
7. Toggle snap grid for precise marker placement
8. Use "Save to File" to download mappings as JSON for backup
9. Click "Go to Seat Booking" to navigate to the booking page

### Booking Page (User)
1. Open `booking.html` or click the booking link from the mapping page
2. **Sign in**:
   - **With Entra ID configured**: Automatically redirects to Microsoft login
   - **Without Entra ID**: A login dialog prompts for your name
     - Check "Allow changing name after sign-in" to keep the name field visible
3. Your name appears in the sidebar (editable if checkbox was checked)
4. Select the date you want to book for
5. **Single seat**: Click on a green (available) seat to select it
6. **Multiple seats**: Click and drag to draw a rectangle and select all available seats within
7. Selected seats appear yellow with chips in the sidebar
8. Click "Book Selected" to book all selected seats at once
9. Click on a blue (your booking) seat to cancel it
10. View your bookings in the summary panel
11. Click the sign-out button (↪) to log out or change user

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

### Microsoft Entra ID Authentication

The booking page supports two authentication modes:

#### Mock Login Mode (Default)

When Entra ID is not configured, the app uses a simple mock login:
- A dialog prompts for your username when you first visit the booking page
- Check **"Allow changing name after sign-in"** to keep the name field visible in the sidebar
- Your name is saved in localStorage for future visits
- Click the sign-out button to change users

This mode works out of the box with no configuration required.

#### Entra ID Mode (Enterprise)

To enable Entra ID authentication for enterprise use:

1. **Register your app in Azure Portal**:
   - Go to [Azure Portal](https://portal.azure.com) → Microsoft Entra ID → App registrations → New registration
   - Set a name (e.g., "Work Area Booking")
   - Set Redirect URI type to "Single-page application (SPA)"
   - Add Redirect URI: `http://localhost:8000/booking.html` (for development)
   - Add production URL as additional redirect URI when deploying

2. **Note your credentials**:
   - Copy the **Application (client) ID**
   - Copy the **Directory (tenant) ID**

3. **Configure the application**:
   - Edit `auth-config.js` and replace the placeholder values:

```javascript
const authConfig = {
    clientId: "YOUR_CLIENT_ID_HERE",      // Application (client) ID
    tenantId: "YOUR_TENANT_ID_HERE",      // Directory (tenant) ID
};
```

4. **For production deployment**:
   - HTTPS is required (localhost is exempt for development)
   - Add your production URL to the app registration redirect URIs

### Default Seat Mappings

To provide default seat mappings, create a `seat-mappings.json` file in the application root. This file will be automatically loaded on startup if no localStorage data exists.

You can create this file by:
1. Mapping seats manually in the application
2. Clicking "Save to File" to download the mappings
3. Renaming the downloaded file to `seat-mappings.json`
4. Placing it in the same directory as `index.html`

## File Structure

- `index.html` - Seat mapping page (admin)
- `booking.html` - Seat booking page (user) with Entra ID authentication
- `styles.css` - Shared styling and layout
- `booking.css` - Booking page specific styles
- `app.js` - Seat mapping application logic
- `booking.js` - Seat booking application logic
- `auth.js` - Microsoft Entra ID authentication module
- `auth-config.js` - Authentication configuration (client ID, tenant ID)
- `SPEC.md` - Detailed specification
- `floor_plan_*.png/jpg/pdf` - Floor plan files
- `seat-mappings.json` - (Optional) Default seat mappings, auto-loaded on startup

## Technical Details

- **Normalized Coordinates**: Uses 0-1 range for consistency across screen sizes and zoom levels
- **SVG Overlay**: Markers rendered in SVG for quality at any zoom level
- **CSS Transform Zoom**: Smooth zooming with proper coordinate handling
- **LocalStorage**: Persistent data storage across browser sessions
- **PDF.js**: External library (CDN) for PDF rendering
- **MSAL.js**: Microsoft Authentication Library for Entra ID integration

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

**Notes**:
- PDF files require serving via HTTP server (not `file://` protocol) due to CORS restrictions
- Entra ID authentication requires HTTPS in production (localhost is allowed for development)

Use a local development server like:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

Then open `http://localhost:8000` in your browser.
