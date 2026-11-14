// Light / dark mode for the admin. One small store, so the header toggle, the login page and the settings page always agree.
// The choice lives in localStorage; until the person picks one, the system setting decides (and is followed live).
// apply(false) runs when this module loads, which is while App's imports load, before index.js renders anything, so
// data-theme is always on <html> by the first paint and admin-theme.css needs only the [data-theme] selectors.
import { useSyncExternalStore } from 'react';

const KEY = 'smartbus.theme';
// How long colours cross-fade when the mode changes. Set as --theme-switch for the html.theme-switching rule in admin-theme.css.
const SWITCH_MS = 220;
const listeners = new Set();
const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

let saved = null;
try { const v = localStorage.getItem(KEY); if (v === 'dark' || v === 'light') saved = v; } catch { /* storage blocked */ }
let mode = saved || (query && query.matches ? 'dark' : 'light');

function apply(animate) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-switching');
    window.setTimeout(() => root.classList.remove('theme-switching'), SWITCH_MS + 40); // one frame after the fade ends
  }
  root.setAttribute('data-theme', mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--a-bg').trim() || (mode === 'dark' ? '#110C0B' : '#FF9A6E'));
}
document.documentElement.style.setProperty('--theme-switch', `${SWITCH_MS}ms`);
apply(false);

const emit = () => listeners.forEach((l) => l());
query?.addEventListener?.('change', (e) => { if (!saved) { mode = e.matches ? 'dark' : 'light'; apply(true); emit(); } });

export function setTheme(next) {
  mode = next === 'dark' ? 'dark' : 'light';
  saved = mode;
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  apply(true);
  emit();
}
export const toggleTheme = () => setTheme(mode === 'dark' ? 'light' : 'dark');
// 'system' | 'light' | 'dark': what the person chose (system = no saved choice, follow the device).
export function setPreference(p) {
  if (p !== 'system') { setTheme(p); return; }
  saved = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  mode = query && query.matches ? 'dark' : 'light';
  apply(true);
  emit();
}

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
export const useThemePreference = () => useSyncExternalStore(subscribe, () => saved || 'system');
export const useThemeMode = () => useSyncExternalStore(subscribe, () => mode);
