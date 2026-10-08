import { Platform, StatusBar } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

export const SESSION_KEY = 'smartbus:session';

export const STALE_MS = 15000; // no update for this long: the bus is shown as "signal lost"

export const GONE_MS = 60000; // no update for this long: the bus is removed from the map

export const MAP_PADDING = { top: 170, bottom: 400 };

// Android draws edge to edge: StatusBar.currentHeight reads 0 there, so use the real safe-area inset.
export const TOP_INSET = Platform.OS === 'android' ? (initialWindowMetrics?.insets.top ?? StatusBar.currentHeight ?? 0) : 0;

export const NO_ROUTE = {
  id: null, number: '–', name: 'No routes yet', shortName: '—', startTerminal: '—', endTerminal: '—',
  distanceKm: 0, stops: [], stopPoints: [], path: [], trackable: false,
};
