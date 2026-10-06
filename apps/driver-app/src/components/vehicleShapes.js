// SmartBus vehicle set — flat, stroke-free, side view, viewBox 0 0 240 120. One data source rendered by
// native (react-native-svg), web (React DOM) and string (Leaflet markers) renderers.
// Colour keys: B=body (overridable) P=primary PL=primary light PD=primary deep A=coral accent
// W=white WIN=windows INK=tyres Y=headlight SH=ground shadow RIB=soft panel line

export const PALETTE = {
  P: '#3A9BC9', PL: '#6DBFE8', PD: '#1F5F85', A: '#F26B85', W: '#FFFFFF',
  WIN: '#1F5F85', INK: '#0F1419', Y: '#FFE08A', TAXI: '#FFC857',
  SH: 'rgba(15,20,25,0.12)', RIB: 'rgba(31,95,133,0.22)',
};

const wheel = (cx, cy, r) => [
  ['circle', { cx, cy, r: r + 3 }, 'PD'],
  ['circle', { cx, cy, r }, 'INK'],
  ['circle', { cx, cy, r: Math.round(r / 2.4) }, 'W'],
];
const shadow = (x, w) => ['rect', { x, y: 112, width: w, height: 5, rx: 2.5 }, 'SH'];

export const VEHICLES = {
  bus: {
    label: 'City bus', body: 'W',
    shapes: [
      shadow(18, 204),
      ['rect', { x: 14, y: 20, width: 204, height: 80, rx: 16 }, 'B'],
      ['rect', { x: 70, y: 12, width: 64, height: 10, rx: 5 }, 'PL'],
      ['rect', { x: 14, y: 68, width: 204, height: 12 }, 'P'],
      ['rect', { x: 14, y: 80, width: 204, height: 4 }, 'A'],
      ...[26, 58, 90, 122].map((x) => ['rect', { x, y: 34, width: 26, height: 26, rx: 6 }, 'WIN']),
      ['rect', { x: 156, y: 34, width: 22, height: 46, rx: 5 }, 'PD'],
      ['rect', { x: 160, y: 38, width: 14, height: 24, rx: 3 }, 'PL'],
      ['rect', { x: 186, y: 34, width: 24, height: 34, rx: 8 }, 'WIN'],
      ['circle', { cx: 212, cy: 90, r: 4 }, 'Y'],
      ['circle', { cx: 20, cy: 90, r: 3 }, 'A'],
      ...wheel(58, 100, 11), ...wheel(176, 100, 11),
    ],
  },
  train: {
    label: 'Metro train', body: 'W',
    shapes: [
      ['rect', { x: 0, y: 110, width: 240, height: 5, rx: 2 }, 'PD'],
      ['path', { d: 'M8 40 Q8 24 26 24 L186 24 Q222 24 234 66 L234 98 L8 98 Z' }, 'B'],
      ['path', { d: 'M8 40 Q8 24 26 24 L186 24 Q205 24 218 40 L8 40 Z' }, 'P'],
      ['rect', { x: 8, y: 74, width: 226, height: 10 }, 'P'],
      ['rect', { x: 8, y: 84, width: 226, height: 4 }, 'A'],
      ...[22, 54, 86].map((x) => ['rect', { x, y: 48, width: 26, height: 22, rx: 5 }, 'WIN']),
      ['rect', { x: 120, y: 46, width: 24, height: 44, rx: 4 }, 'PD'],
      ['rect', { x: 124, y: 50, width: 16, height: 26, rx: 3 }, 'PL'],
      ['rect', { x: 152, y: 48, width: 26, height: 22, rx: 5 }, 'WIN'],
      ['path', { d: 'M186 46 L204 46 Q216 56 222 72 L186 72 Z' }, 'WIN'],
      ['circle', { cx: 230, cy: 88, r: 3 }, 'Y'],
      ['rect', { x: 96, y: 14, width: 36, height: 4, rx: 2 }, 'PD'],
      ['rect', { x: 112, y: 16, width: 4, height: 10 }, 'PD'],
      ['rect', { x: 22, y: 98, width: 48, height: 8, rx: 4 }, 'PD'],
      ['rect', { x: 150, y: 98, width: 48, height: 8, rx: 4 }, 'PD'],
      ...[34, 58, 162, 186].flatMap((cx) => [['circle', { cx, cy: 104, r: 7 }, 'INK'], ['circle', { cx, cy: 104, r: 2.5 }, 'W']]),
    ],
  },
  taxi: {
    label: 'Taxi', body: 'TAXI',
    shapes: [
      shadow(20, 200),
      ['rect', { x: 16, y: 60, width: 208, height: 38, rx: 14 }, 'B'],
      ['path', { d: 'M62 62 L84 32 Q88 27 95 27 L150 27 Q157 27 161 32 L184 62 Z' }, 'B'],
      ['path', { d: 'M72 60 L89 36 L116 36 L116 60 Z' }, 'WIN'],
      ['path', { d: 'M124 36 L148 36 Q150 36 152 38 L170 60 L124 60 Z' }, 'WIN'],
      ['rect', { x: 104, y: 16, width: 34, height: 11, rx: 4 }, 'A'],
      ['rect', { x: 16, y: 76, width: 208, height: 6 }, 'A'],
      ['rect', { x: 118, y: 66, width: 10, height: 3, rx: 1.5 }, 'PD'],
      ['circle', { cx: 218, cy: 70, r: 4 }, 'W'],
      ['circle', { cx: 22, cy: 70, r: 3 }, 'A'],
      ...wheel(66, 98, 10), ...wheel(176, 98, 10),
    ],
  },
  tuktuk: {
    label: 'Three-wheeler', body: 'A',
    shapes: [
      shadow(40, 180),
      ['path', { d: 'M56 34 Q56 18 76 18 L150 18 Q168 18 174 34 L176 40 L56 40 Z' }, 'PD'],
      ['rect', { x: 60, y: 40, width: 5, height: 30 }, 'PD'],
      ['rect', { x: 168, y: 40, width: 5, height: 30 }, 'PD'],
      ['path', { d: 'M174 40 L196 68 L174 68 Z' }, 'WIN'],
      ['rect', { x: 70, y: 46, width: 52, height: 22, rx: 8 }, 'PL'],
      ['path', { d: 'M48 66 L176 66 Q196 66 204 80 L206 92 L48 92 Z' }, 'B'],
      ['rect', { x: 48, y: 80, width: 158, height: 5 }, 'W'],
      ['rect', { x: 194, y: 78, width: 6, height: 22, rx: 3 }, 'PD'],
      ['circle', { cx: 204, cy: 76, r: 4 }, 'Y'],
      ...wheel(84, 98, 11), ...wheel(198, 100, 8),
    ],
  },
  scooter: {
    label: 'Delivery scooter', body: 'P',
    shapes: [
      shadow(30, 180),
      ['rect', { x: 22, y: 34, width: 40, height: 32, rx: 5 }, 'A'],
      ['rect', { x: 22, y: 46, width: 40, height: 5 }, 'W'],
      ['path', { d: 'M40 76 Q42 56 70 56 L108 56 L108 82 L48 82 Z' }, 'B'],
      ['rect', { x: 62, y: 48, width: 50, height: 10, rx: 5 }, 'PD'],
      ['rect', { x: 96, y: 78, width: 66, height: 8, rx: 4 }, 'B'],
      ['path', { d: 'M158 84 L170 40 L184 40 L176 84 Z' }, 'B'],
      ['path', { d: 'M172 80 L192 100 L186 104 L168 86 Z' }, 'PD'],
      ['rect', { x: 164, y: 30, width: 28, height: 7, rx: 3.5 }, 'PD'],
      ['rect', { x: 172, y: 34, width: 6, height: 10 }, 'PD'],
      ['circle', { cx: 186, cy: 48, r: 5 }, 'Y'],
      ...wheel(58, 96, 12), ...wheel(190, 96, 12),
    ],
  },
  van: {
    label: 'Delivery van', body: 'P',
    shapes: [
      shadow(14, 214),
      ['rect', { x: 12, y: 28, width: 150, height: 72, rx: 10 }, 'B'],
      ['path', { d: 'M158 46 L192 46 Q206 47 214 62 L224 78 Q228 84 228 92 L228 100 L158 100 Z' }, 'B'],
      ['path', { d: 'M166 52 L190 52 Q198 53 204 64 L166 64 Z' }, 'WIN'],
      ['rect', { x: 12, y: 68, width: 216, height: 8 }, 'A'],
      ['circle', { cx: 84, cy: 46, r: 14 }, 'W'],
      ['circle', { cx: 84, cy: 46, r: 6 }, 'A'],
      ['rect', { x: 218, y: 90, width: 12, height: 8, rx: 3 }, 'PD'],
      ['circle', { cx: 226, cy: 84, r: 3.5 }, 'Y'],
      ...wheel(58, 100, 11), ...wheel(190, 100, 11),
    ],
  },
  truck: {
    label: 'Cargo truck', body: 'PL',
    shapes: [
      shadow(8, 224),
      ['rect', { x: 166, y: 18, width: 5, height: 30, rx: 2.5 }, 'PD'],
      ['rect', { x: 8, y: 16, width: 156, height: 84, rx: 8 }, 'B'],
      ...[48, 86, 124].map((x) => ['rect', { x, y: 22, width: 3, height: 38 }, 'RIB']),
      ['rect', { x: 8, y: 66, width: 156, height: 9 }, 'A'],
      ['path', { d: 'M168 40 L198 40 Q212 41 220 58 L230 74 L230 100 L168 100 Z' }, 'P'],
      ['path', { d: 'M176 46 L196 46 Q204 47 210 58 L176 58 Z' }, 'WIN'],
      ['rect', { x: 222, y: 90, width: 12, height: 9, rx: 3 }, 'PD'],
      ['circle', { cx: 228, cy: 80, r: 3.5 }, 'Y'],
      ...wheel(40, 100, 10), ...wheel(72, 100, 10), ...wheel(192, 100, 10),
    ],
  },
};

// Hero compositions: [vehicle, x, y, scale] on a 360x200 canvas (road top at y=168).
// y is chosen so each vehicle's wheels sit on the road (y + 108*scale ≈ 176).
export const SCENES = {
  login: [['train', -22, 112, 0.58], ['bus', 118, 80, 0.84], ['taxi', 252, 114, 0.54]],
  register: [['bus', -6, 119, 0.52], ['tuktuk', 108, 107, 0.62], ['scooter', 250, 122, 0.48]],
  driver: [['van', -6, 124, 0.46], ['bus', 108, 62, 1.0]],
  admin: [['train', 0, 78, 0.92], ['truck', 220, 112, 0.58]],
};

export const resolve = (key, body, palette = PALETTE) => (key === 'B' ? palette[body] || body : palette[key]);

// Plain SVG string (Leaflet markers, anything non-React).
export function vehicleSvgString(name, { body, size = 56, palette = PALETTE } = {}) {
  const v = VEHICLES[name];
  const inner = v.shapes
    .map(([t, a, c]) => `<${t} ${Object.entries(a).map(([k, val]) => `${k}="${val}"`).join(' ')} fill="${resolve(c, body || v.body, palette)}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size / 2}" viewBox="0 0 240 120" role="img" aria-label="${v.label}">${inner}</svg>`;
}
