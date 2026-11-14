export const SESSION_KEY = 'smartbus:session';

export const MAP_PADDING = { top: 170, bottom: 400 };

// Tab ids for the dock and the screen switch in App.js. Settings is not in the dock: it opens from Profile and Home,
// so the dock shows Profile while it is open.
export const TABS = { home: 'home', tracking: 'tracking', routes: 'routes', profile: 'profile', settings: 'settings' };

export const NO_ROUTE = {
  id: null, number: '–', name: 'No routes yet', shortName: '—', startTerminal: '—', endTerminal: '—',
  distanceKm: 0, stops: [], stopPoints: [], path: [], trackable: false,
};
