// Light / dark mode for the admin. One small store, so the header toggle, the login page and the maps always agree.
// The choice lives in localStorage; until the person picks one, the system setting decides (and is followed live).
import { useSyncExternalStore } from 'react';

const KEY = 'smartbus.theme';
const listeners = new Set();
const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

let saved = null;
try { const v = localStorage.getItem(KEY); if (v === 'dark' || v === 'light') saved = v; } catch { /* storage blocked */ }
let mode = saved || (query && query.matches ? 'dark' : 'light');

function apply(animate) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-switching');
    window.setTimeout(() => root.classList.remove('theme-switching'), 260);
  }
  root.setAttribute('data-theme', mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#0F0E0B' : '#D7F34B');
}
apply(false);

const emit = () => listeners.forEach((l) => l());
if (query) {
  const onChange = (e) => { if (!saved) { mode = e.matches ? 'dark' : 'light'; apply(true); emit(); } };
  if (query.addEventListener) query.addEventListener('change', onChange); else if (query.addListener) query.addListener(onChange);
}

export function setTheme(next) {
  mode = next === 'dark' ? 'dark' : 'light';
  saved = mode;
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  apply(true);
  emit();
}
export const toggleTheme = () => setTheme(mode === 'dark' ? 'light' : 'dark');
export const useThemeMode = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => mode);

// OpenStreetMap tiles for Leaflet; the colour comes from a CSS filter (see admin-theme.css). Route colour follows the mode.
const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_URL = { light: OSM, dark: OSM };
export const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';
export const routeColor = (m) => (m === 'dark' ? '#D7F34B' : '#15140F');
