// Backend access shared by the driver and passenger apps.
// Source of truth: /shared/native/api.js (copied into each app by `node shared/sync.js`).
import { Platform } from 'react-native';

// Set EXPO_PUBLIC_API_URL (e.g. http://192.168.1.20:5000) to reach the backend from a real phone.
// Defaults: Android emulator -> host machine, everything else -> localhost.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')).replace(/\/$/, '');

export async function request(path, { method = 'GET', body, token, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : null) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    // Expo's fetch reports a timeout as a plain Error ("Fetch request has been canceled"), so match on the message too.
    if (err.name === 'AbortError' || err instanceof TypeError || /fetch|network|cancel|abort/i.test(err.message || '')) throw new Error('Cannot reach the server. Check your connection and try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// API route document (GeoJSON, [lng, lat]) -> the plain shape the screens and the map use.
export function toRoute(doc) {
  if (!doc) return null;
  const stopPoints = (doc.stopPoints || []).map((s) => ({ name: s.name, lat: s.location.coordinates[1], lng: s.location.coordinates[0] }));
  return {
    id: doc.routeId,
    number: doc.routeNumber || (doc.routeId || '').replace(/\D/g, '').replace(/^0+/, '') || '–',
    name: doc.name,
    shortName: doc.routeNumber ? `Route ${doc.routeNumber}` : doc.routeId,
    startTerminal: doc.start,
    endTerminal: doc.end,
    distanceKm: doc.distance,
    stops: stopPoints.length ? stopPoints.map((s) => s.name) : doc.stops || [],
    stopPoints,
    path: (doc.path?.coordinates || []).map(([lng, lat]) => [lat, lng]),
    trackable: stopPoints.length >= 2 && (doc.path?.coordinates || []).length >= 2,
  };
}
