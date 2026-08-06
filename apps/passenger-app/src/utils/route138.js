export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
export const OSRM_ROUTE_BASE_URL =
  process.env.EXPO_PUBLIC_OSRM_ROUTE_URL || 'https://router.project-osrm.org/route/v1/driving';

export const ROUTE_138_START = { latitude: 6.9364, longitude: 79.8488 };
export const ROUTE_138_END = { latitude: 6.848, longitude: 79.9265 };
export const ROUTE_138_WAYPOINTS = [
  { latitude: 6.9147, longitude: 79.8778 },
  { latitude: 6.8904, longitude: 79.8757 },
  { latitude: 6.8721, longitude: 79.8884 },
];

export const ROUTE_138_FALLBACK_COORDS = [
  ROUTE_138_START,
  ...ROUTE_138_WAYPOINTS,
  ROUTE_138_END,
];

export function buildOsrmRouteUrl({ startCoordinate, endCoordinate, waypoints = [] }) {
  const coordinates = [startCoordinate, ...waypoints, endCoordinate]
    .filter(Boolean)
    .map(({ latitude, longitude }) => `${longitude},${latitude}`)
    .join(';');

  return `${OSRM_ROUTE_BASE_URL}/${coordinates}?overview=full&geometries=geojson`;
}

export async function fetchRoadRoute({
  startCoordinate = ROUTE_138_START,
  endCoordinate = ROUTE_138_END,
  waypoints = ROUTE_138_WAYPOINTS,
} = {}) {
  const response = await fetch(buildOsrmRouteUrl({ startCoordinate, endCoordinate, waypoints }));

  if (!response.ok) {
    throw new Error(`OSRM route request failed: ${response.status}`);
  }

  const data = await response.json();
  const route = data.routes?.[0]?.geometry?.coordinates;

  if (!Array.isArray(route) || route.length === 0) {
    throw new Error('OSRM response did not include route geometry');
  }

  return route.map(([longitude, latitude]) => ({ latitude, longitude }));
}
