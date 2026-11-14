// Map settings shared by the live monitor and the route editor.
export const MAP_CENTER = [6.9, 79.87]; // Colombo, where a map opens when it has nothing of its own to show

// OpenStreetMap tiles for Leaflet. Light and dark use the same tiles; admin-theme.css recolours them with a filter.
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';

// A route line in the accent colour (the same in both modes).
export const routeColor = () => getComputedStyle(document.documentElement).getPropertyValue('--orange').trim() || '#FF6B35';
