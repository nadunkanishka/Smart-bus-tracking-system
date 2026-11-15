export const SESSION_KEY = 'smartbus:session';
// The passenger's usual journey (route and stops), kept per account so it survives closing the app.
export const JOURNEY_KEY = 'smartbus:journey';

export const MAP_PADDING = { top: 170, bottom: 480 };
// Below the map when the bottom card is short (bus, status and progress only).
export const MAP_PADDING_COMPACT_BOTTOM = 320;

// Tab ids for the dock and the screen switch in App.js. Settings is not in the dock: it opens from Profile and Home,
// so the dock shows Profile while it is open.
export const TABS = { home: 'home', tracking: 'tracking', routes: 'routes', profile: 'profile', settings: 'settings' };

export const NO_ROUTE = {
  id: null, number: '–', name: 'No routes yet', shortName: '—', startTerminal: '—', endTerminal: '—',
  distanceKm: 0, stops: [], stopPoints: [], path: [], trackable: false,
};

// The dock: tab, label and NavIcon glyph.
export const DOCK_TABS = [
  { id: TABS.home, label: 'Home', glyph: 'home' },
  { id: TABS.tracking, label: 'Track', glyph: 'arrow' },
  { id: TABS.routes, label: 'Routes', glyph: 'route' },
  { id: TABS.profile, label: 'Profile', glyph: 'user' },
];
