// SmartBus bus set — flat fills, one round-capped outline, side view facing right. One data source rendered by
// native (react-native-svg), web (React DOM) and string (Leaflet markers) renderers.
// Shape: [tag, attrs, colourKey, opts]. opts: ns = no outline, sw = outline width, sk = outline colour key,
// gap = dasharray (the one hand-drawn break in each body outline).
// Colour keys: B=body (overridable) ACC=stripe (overridable) plus any PALETTE key; 'none' = no fill.

export const PALETTE = {
  INK: '#1B1B1F', W: '#FFFFFF', CREAM: '#FFF8EA', BUTTER: '#FFEDB3',
  P: '#3A9BC9', PL: '#6DBFE8', PD: '#1F5F85', A: '#F26B85',
  Y: '#FFD66B', O: '#FFA552', TIRE: '#3A3D47',
};
// Offline look: same drawing, colour drained, lights out.
const PALETTE_OFF = { ...PALETTE, CREAM: '#ECEEF1', BUTTER: '#ECEEF1', PL: '#C3CAD3', P: '#9AA4B0', Y: '#D8DCE2' };

export const STROKE = 7; // 2.9% of the 240 canvas; doors and lamps use 5
const BOX = [0, 18, 240, 166]; // viewBox for every detail bus (wheels sit at y=177)

const wheel = (cx, cy, r = 17.5) => [['circle', { cx, cy, r }, 'TIRE'], ['circle', { cx, cy, r: +(r * 0.38).toFixed(1) }, 'CREAM', { ns: 1 }]];
const win = (xs, y, width, height) => xs.map((x) => ['rect', { x, y, width, height, rx: 8 }, 'PL']);
const door = (x, y, width, height) => [
  ['rect', { x, y, width, height, rx: 8 }, 'B', { sw: 5 }],
  ['rect', { x: x + 7, y: y + 8, width: width - 14, height: Math.min(30, height - 30), rx: 5 }, 'PL', { ns: 1 }],
];
const lamp = (cx, cy) => ['circle', { cx, cy, r: 6.5 }, 'Y', { sw: 5 }];

const CITY = 'M52 47 Q120 43 188 46 Q219 47 218 80 L218 130 Q218 158 190 158 L50 158 Q22 158 22 130 L22 78 Q22 48 52 47 Z';
const COACH = 'M40 62 L176 61 Q212 62 222 96 L226 128 Q228 158 200 158 L40 158 Q14 158 14 132 L14 88 Q14 62 40 62 Z';
const MINI = 'M70 60 L150 59 Q178 60 190 88 L200 114 Q208 120 208 134 Q208 158 184 158 L68 158 Q44 158 44 134 L44 86 Q44 60 70 60 Z';
const SCHOOL = 'M48 50 L150 49 Q176 50 178 76 L180 96 L200 98 Q222 100 222 122 L222 136 Q222 158 200 158 L46 158 Q22 158 22 134 L22 76 Q22 50 48 50 Z';
const DECKER = 'M52 30 L188 29 Q216 30 216 58 L218 132 Q218 158 192 158 L50 158 Q22 158 22 132 L22 58 Q22 30 52 30 Z';

export const VEHICLES = {
  bus: {
    label: 'City bus', body: 'CREAM', status: true,
    shapes: [
      ['rect', { x: 86, y: 27, width: 68, height: 26, rx: 10 }, 'PL'], // blank route board
      ['path', { d: 'M106 38 H134' }, 'none', { sw: 5, sk: 'W' }],
      ['path', { d: CITY }, 'B', { ns: 1 }],
      ['rect', { x: 22, y: 116, width: 196, height: 13 }, 'ACC', { ns: 1 }],
      ...win([36, 70], 62, 27, 30),
      ...door(106, 60, 34, 88),
      ['rect', { x: 152, y: 62, width: 54, height: 40, rx: 9 }, 'PL'],
      ['path', { d: CITY }, 'none', { gap: '38 15 2000' }],
      lamp(204, 144),
      ...wheel(70, 160), ...wheel(170, 160),
    ],
  },
  coach: {
    label: 'Intercity coach', body: 'CREAM',
    shapes: [
      ['rect', { x: 66, y: 46, width: 54, height: 22, rx: 9 }, 'B'], // roof AC
      ['path', { d: COACH }, 'B', { ns: 1 }],
      ['rect', { x: 14, y: 116, width: 212, height: 11 }, 'ACC', { ns: 1 }],
      ['rect', { x: 26, y: 74, width: 126, height: 28, rx: 9 }, 'PL'],
      ['path', { d: 'M68 74 V102 M110 74 V102' }, 'none', { sw: 5 }],
      ...door(160, 72, 26, 76),
      ['path', { d: 'M195 77 L200 77 Q206 82 209 100 L195 100 Z' }, 'PL', { sw: 5 }],
      ['rect', { x: 88, y: 136, width: 58, height: 13, rx: 5 }, 'B', { sw: 4 }], // luggage bay
      ['path', { d: COACH }, 'none', { gap: '60 15 2000' }],
      lamp(211, 143),
      ...wheel(56, 160), ...wheel(180, 160),
    ],
  },
  minibus: {
    label: 'Minibus', body: 'CREAM',
    shapes: [
      ['path', { d: 'M80 60 V50 H140 V60' }, 'none'], // roof rack
      ['path', { d: MINI }, 'B', { ns: 1 }],
      ['rect', { x: 44, y: 119, width: 161, height: 11 }, 'ACC', { ns: 1 }],
      ...win([58, 92], 74, 27, 28),
      ['path', { d: 'M130 82 Q130 74 138 74 L152 74 Q164 76 171 92 L175 102 L138 102 Q130 102 130 94 Z' }, 'PL'],
      ['path', { d: MINI }, 'none', { gap: '50 15 2000' }],
      lamp(193, 144),
      ...wheel(80, 161, 16.5), ...wheel(170, 161, 16.5),
    ],
  },
  school: {
    label: 'School bus', body: 'BUTTER',
    shapes: [
      ['rect', { x: 90, y: 35, width: 24, height: 22, rx: 8 }, 'A'], // roof beacon
      ['path', { d: SCHOOL }, 'B', { ns: 1 }],
      ['rect', { x: 22, y: 118, width: 200, height: 8 }, 'TIRE', { ns: 1 }],
      ...win([36, 70, 104], 64, 27, 28),
      ['rect', { x: 140, y: 64, width: 28, height: 30, rx: 8 }, 'PL'],
      ['path', { d: SCHOOL }, 'none', { gap: '40 15 2000' }],
      lamp(207, 142),
      ...wheel(68, 160), ...wheel(178, 160),
    ],
  },
  decker: {
    label: 'Double-decker bus', body: 'CREAM',
    shapes: [
      ['path', { d: DECKER }, 'B', { ns: 1 }],
      ['rect', { x: 22, y: 78, width: 195, height: 11 }, 'ACC', { ns: 1 }],
      ...win([34, 69, 104, 139, 174], 42, 28, 26),
      ...win([36, 70], 100, 27, 26),
      ...door(106, 98, 34, 52),
      ['rect', { x: 152, y: 100, width: 54, height: 28, rx: 8 }, 'PL'],
      ['path', { d: DECKER }, 'none', { gap: '45 15 2000' }],
      lamp(204, 144),
      ...wheel(70, 160), ...wheel(170, 160),
    ],
  },
  // Map marker: 48 grid, thicker relative outline, no door and no gap so it reads at 32px.
  marker: {
    label: 'Bus', body: 'CREAM', box: [0, 6, 48, 40], sw: 4,
    shapes: [
      ['rect', { x: 5, y: 10, width: 38, height: 26, rx: 8 }, 'B'],
      ['rect', { x: 7, y: 26, width: 34, height: 5 }, 'ACC', { ns: 1 }],
      ['rect', { x: 10, y: 15, width: 19, height: 8, rx: 2.5 }, 'PL', { ns: 1 }],
      ['rect', { x: 32, y: 15, width: 7, height: 8, rx: 2.5 }, 'PL', { ns: 1 }],
      ['circle', { cx: 15, cy: 37, r: 4.5 }, 'TIRE', { sw: 3 }],
      ['circle', { cx: 33, cy: 37, r: 4.5 }, 'TIRE', { sw: 3 }],
    ],
  },
};

// Status props for the city bus, drawn above the roof and under the body. Always pair with a text label in the UI.
const STATUS = {
  idle: { label: 'off duty', shapes: [['path', { d: 'M166 24 h12 l-12 14 h12' }, 'none', { sw: 5 }], ['path', { d: 'M186 22 h8 l-8 9 h8' }, 'none', { sw: 4 }]] },
  maint: { label: 'needs attention', shapes: [['path', { d: 'M168 52 L177 27 Q181 21 185 27 L194 52 Z' }, 'O'], ['path', { d: 'M175 38 H187' }, 'none', { sw: 4, sk: 'W' }]] },
  off: { label: 'offline', palette: PALETTE_OFF, shapes: [['path', { d: 'M172 24 L186 38 M186 24 L172 38' }, 'none', { sw: 5 }]] },
};

// Hero compositions: [vehicle, x, y, scale] on a 360x200 canvas (road top at y=168).
// y is chosen so each bus's wheels sit on the road (y + 181*scale ≈ 176).
export const SCENES = {
  login: [['coach', 2, 85, 0.5], ['bus', 104, 42, 0.74], ['minibus', 248, 85, 0.5]],
  register: [['minibus', -14, 82, 0.52], ['decker', 92, 46, 0.72], ['school', 244, 85, 0.5]],
  driver: [['minibus', -10, 93, 0.46], ['bus', 100, 4, 0.95]],
  admin: [['coach', 0, 31, 0.8], ['decker', 200, 71, 0.58]],
};

// Everything a renderer needs for one drawing. Unknown names fall back to the city bus.
export function build(name, status) {
  const v = VEHICLES[name] || VEHICLES.bus;
  const st = (v.status && STATUS[status]) || null;
  return {
    v,
    shapes: st ? [...st.shapes, ...v.shapes] : v.shapes,
    palette: (st && st.palette) || PALETTE,
    box: v.box || BOX,
    label: st ? `${v.label}, ${st.label}` : v.label,
  };
}

// Paint props for one shape: { fill } plus the outline props unless the shape opts out.
export function paint([, , c, o = {}], v, { body, accent, palette = PALETTE } = {}) {
  const col = (k) => (k === 'B' ? palette[body || v.body] || body : k === 'ACC' ? palette[accent || 'P'] || accent : palette[k]);
  const p = { fill: c === 'none' ? 'none' : col(c) };
  if (!o.ns) {
    Object.assign(p, { stroke: col(o.sk || 'INK'), strokeWidth: o.sw || v.sw || STROKE, strokeLinecap: 'round', strokeLinejoin: 'round' });
    if (o.gap) p.strokeDasharray = o.gap;
  }
  return p;
}

const kebab = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const attrs = (o) => Object.entries(o).map(([k, val]) => `${kebab(k)}="${val}"`).join(' ');

// Plain SVG string (Leaflet markers, anything non-React). `size` is the width in px.
export function vehicleSvgString(name, { body, accent, status, size = 56 } = {}) {
  const { v, shapes, palette, box, label } = build(name, status);
  const inner = shapes.map((s) => `<${s[0]} ${attrs(s[1])} ${attrs(paint(s, v, { body, accent, palette }))}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round((size * box[3]) / box[2])}" viewBox="${box.join(' ')}" role="img" aria-label="${label}">${inner}</svg>`;
}
