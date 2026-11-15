// The agreement between the server and its three clients (admin dashboard, driver app, passenger app).
// Source of truth. `node shared/sync.js` copies it to every client and writes a CommonJS copy to backend/lib/contract.js,
// so a name or a number is changed here once. Keep this file to `export const` and `export function` with no imports,
// because the backend copy is produced by removing the `export` keywords.

// Socket.IO events.
export const EVENTS = {
  FIX: 'gps:fix', // driver to server: one position
  BATCH: 'gps:batch', // driver to server: positions saved while offline
  DUTY: 'driver:duty',
  AUTH: 'driver:auth',
  SUBSCRIBE: 'route:subscribe', // passenger to server
  UNSUBSCRIBE: 'route:unsubscribe',
  SNAPSHOT: 'route:snapshot', // server to passenger: latest position of every bus on the route
  UPDATE: 'bus:update', // server to passenger: one bus moved
  OFFLINE: 'bus:offline',
};

// Allowed values of each record's status, first one is the default.
export const STATUS = {
  bus: ['Active', 'Idle', 'Maintenance'],
  driver: ['Active', 'Inactive', 'On Leave'],
  route: ['Active', 'Inactive', 'Under Construction'],
};

// Record ids: BUS-001, DRV-001, RT-001.
export const ID_PREFIX = { bus: 'BUS', driver: 'DRV', route: 'RT' };
export function formatId(kind, n) {
  return `${ID_PREFIX[kind]}-${String(n).padStart(3, '0')}`;
}

// How often positions arrive and how long they stay meaningful. Order that must hold:
// FIX_INTERVAL_MS < LIVE_WINDOW_MS < GONE_AFTER_MS, and CLIENT_BATCH <= MAX_BATCH.
export const FIX_INTERVAL_MS = 3000; // a driver phone sends a position this often
export const LIVE_WINDOW_MS = 15000; // a position older than this is not live: passengers see "signal lost"
export const GONE_AFTER_MS = 60000; // a bus not heard from for this long is dropped from the latest-position cache
export const MAX_BATCH = 1000; // the server accepts at most this many saved positions in one batch
export const CLIENT_BATCH = 500; // the driver app sends this many at a time
export const MAX_QUEUE = 2000; // the driver app keeps at most this many unsent positions
export const MAX_SPEED_MPS = 45; // the server rejects faster than this (162 km/h)
export const CLIENT_SPEED_CAP_MPS = 40; // the driver app never reports more than this
