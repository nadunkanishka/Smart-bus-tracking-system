// SmartBus clay bus set: which baked image to show for a given bus, colour and state.
// The art itself is generated from code in shared/buses (clay.js → export.mjs) and shipped as WebP images;
// this file is the small, renderer-free lookup shared by the native, web and Leaflet layers.

export const VEHICLES = ['bus', 'coach', 'minibus', 'school', 'decker', 'driver', 'route'];
const PROPS = ['driver', 'route']; // not buses: one image each, no states
// The city bus is baked in every colour; the other types only in the colours listed (first = default).
// Keep in step with TYPES[...].themes in shared/buses/clay.js; sync.js fails if an image is missing.
export const LIVERIES = ['green', 'teal', 'coral', 'yellow', 'orange', 'purple', 'navy', 'red', 'mint', 'cream'];
const BAKED = { bus: ['teal', ...LIVERIES], coach: ['coral', 'mint'], minibus: ['mint', 'coral'], school: ['yellow'], decker: ['red'], driver: ['coral'], route: ['mint'] };
const LABEL = { bus: 'City bus', coach: 'Intercity coach', minibus: 'Minibus', school: 'School bus', decker: 'Double-decker bus', driver: 'Bus driver', route: 'Route with stops' };
export const SCENES = ['login', 'register', 'driver', 'admin'];
export const ASPECT = 400 / 480; // every bus image is 6:5, so states never resize the art

// Status badges sit on the corner of the image. Always pair them with a text label in the UI.
export const STATUS = {
  idle: { label: 'off duty', glyph: 'z', bg: '#FFFFFF', fg: '#1F5F85' },
  maint: { label: 'needs attention', glyph: '!', bg: '#FFB020', fg: '#1B1B1F' },
  off: { label: 'offline', glyph: '×', bg: '#5B6673', fg: '#FFFFFF' },
};

// Stable colour for any id (route, bus), so the same thing always gets the same livery.
export const liveryFor = (key) => LIVERIES[[...String(key)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % LIVERIES.length];

// → { key, label, badge }. key names a file in shared/buses/out (see manifest() in shared/buses/clay.js).
export function pick(name, { livery, status, running } = {}) {
  const type = VEHICLES.includes(name) ? name : 'bus';
  if (PROPS.includes(type)) return { key: `${type}-${BAKED[type][0]}-idle`, label: LABEL[type], badge: null };
  const badge = STATUS[status] || null;
  const label = badge ? `${LABEL[type]}, ${badge.label}` : LABEL[type];
  if (status === 'off') return { key: 'bus-off', label, badge }; // one grey bus stands in for every type
  const theme = BAKED[type].includes(livery) ? livery : BAKED[type][0];
  // Off duty / needs attention: parked with lights off (city bus) or simply standing (other types).
  const pose = badge ? (type === 'bus' ? 'parked' : 'idle') : running ? 'running' : 'idle';
  return { key: `${type}-${theme}-${pose}`, label, badge };
}

// GPS heading (degrees clockwise from north) → index into MARKERS (8 baked headings, 45° apart).
// No heading → index 3, a three-quarter view.
export const markerIndex = (gps) => (gps == null || Number.isNaN(Number(gps)) ? 3 : ((Math.round(Number(gps) / 45) % 8) + 8) % 8);
