// SmartBus isometric bus set. Each bus is a tiny 3D model (boxes + rectangles placed on their faces + wheels)
// projected to flat SVG primitives, so every heading, livery, status and the map marker come from one model.
// One data source rendered by native (react-native-svg), web (React DOM) and string (Leaflet markers) renderers.
//
// World: +x = front of the bus, +y = door (left) side, +z = up; units are roughly metres.
// Screen: true 30° isometric, x = (X - Y)·cos30, y = (X + Y)·sin30 - Z. heading 0 shows the front and the door side.

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const SHADE = '#22406A'; // every face mixes toward this: top 0%, lit side 7%, far side 24%
const SV = [0.35, -0.85]; // ground shadow offset per unit of height, fixed in world space
const UNIT = 10; // viewBox units per world unit for detail art
const SHADOW = 'rgba(22,48,82,0.2)';

export const PALETTE = {
  body: '#FBFAF6', roof: '#FFFFFF', roofUnit: '#E3E9F0', doorFrame: '#DCE3EB', panel: '#E9EDF2',
  glass: '#3D8FD1', trim: '#3B4652', tire: '#2E3540', hub: '#E8EDF2',
  lampOn: '#FFD66B', lampOff: '#CBD5DF', tail: '#F26B85', board: '#22303C', boardLit: '#FFD66B',
  pole: '#93A6B8', sign: '#2F7FC0', signMark: '#FFFFFF',
  PD: '#1F5F85', // brand deep teal, used by scenes
};
const OFFLINE = {
  body: '#E4E7EB', roof: '#EEF0F3', roofUnit: '#D3D8DE', doorFrame: '#D3D8DE', panel: '#D9DDE2', glass: '#A9B6C3',
  livery: '#9AA4B0', accent: '#B4BCC6', lampOn: '#CBD5DF', tail: '#B4BCC6', boardLit: '#8793A0',
};

// [stripe, thin second line]. Windows stay the same blue on every livery.
export const LIVERY = {
  teal: ['#3A9BC9', '#F26B85'], coral: ['#F26B85', '#1F5F85'], navy: ['#1F3A5F', '#6DBFE8'], red: ['#E5484D', '#FFD66B'],
  orange: ['#F28C38', '#1F5F85'], sun: ['#F5C542', '#3B4652'], mint: ['#3FB68B', '#6DBFE8'], violet: ['#7C6BD9', '#FFD66B'],
};
// Stable colour for any id (route, bus), so the same thing always gets the same livery.
export const liveryFor = (key) => {
  const names = Object.keys(LIVERY);
  return names[[...String(key)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % names.length];
};

// ── Models ───────────────────────────────────────────────────────────────────
const win = (u0, u1, v0, v1) => ({ u0, u1, v0, v1, c: 'glass' });
const doorAt = (u0, u1, v0, v1) => [{ u0, u1, v0, v1, c: 'doorFrame' }, win(u0 + 0.1, (u0 + u1) / 2 - 0.05, v0 + 0.3, v1 - 0.1), win((u0 + u1) / 2 + 0.05, u1 - 0.1, v0 + 0.3, v1 - 0.1)];
const band = (len, v, t = 0.27) => [{ u0: 0, u1: len, v0: v, v1: v + t, c: 'livery' }, { u0: 0, u1: len, v0: v - 0.15, v1: v - 0.07, c: 'accent', d: 1 }, { u0: 0, u1: len, v0: 0, v1: 0.2, c: 'trim', d: 1 }];
const lamps = (w, v) => [{ u0: 0.2, u1: 0.7, v0: v, v1: v + 0.26, c: 'lamp' }, { u0: w - 0.7, u1: w - 0.2, v0: v, v1: v + 0.26, c: 'lamp' }];
const tails = (w, v) => [{ u0: 0.15, u1: 0.5, v0: v, v1: v + 0.3, c: 'tail' }, { u0: w - 0.5, u1: w - 0.15, v0: v, v1: v + 0.3, c: 'tail' }];
const bumper = (w) => ({ u0: 0, u1: w, v0: 0, v1: 0.22, c: 'trim', d: 1 });
const roofUnit = (x0, x1, y0, y1, z, h) => ({ x: [x0, x1], y: [y0, y1], z: [z, z + h], c: 'roofUnit', layer: 1, bevel: 0.05, d: 1 });

const MODELS = {
  bus() {
    const L = 10, W = 2.6, H = 2.9, z = 0.45;
    return { label: 'City bus', livery: 'teal', len: L, top: z + H, pivot: [L / 2, W / 2], wheels: { r: 0.52, xs: [2, 7.3], y0: 0, y1: W }, boxes: [
      { x: [0, L], y: [0, W], z: [z, z + H], c: 'body', top: 'roof', faces: {
        left: [...band(L, 0.95), win(0.5, 1.9, 1.4, 2.35), win(2.1, 3.5, 1.4, 2.35), ...doorAt(3.8, 5, 0.2, 2.4), win(5.3, 6.6, 1.4, 2.35), win(6.8, 8, 1.4, 2.35), ...doorAt(8.3, 9.5, 0.2, 2.4)],
        right: [...band(L, 0.95), ...[0.5, 2.1, 3.7, 5.3, 6.9].map((u) => win(u, u + 1.4, 1.4, 2.35)), win(8.5, 9.5, 1.4, 2.35)],
        front: [{ u0: 0, u1: W, v0: 0.85, v1: 1.05, c: 'livery' }, bumper(W), win(0.2, 2.4, 1.2, 2.4), { u0: 0.45, u1: 2.15, v0: 2.5, v1: 2.78, c: 'board' }, { u0: 0.8, u1: 1.8, v0: 2.6, v1: 2.68, c: 'boardLit', d: 1 }, ...lamps(W, 0.36)],
        back: [...band(W, 0.95), win(0.4, 2.2, 1.5, 2.35), ...tails(W, 0.45)],
      } },
      roofUnit(2.2, 3.6, 0.8, 1.8, z + H, 0.16), roofUnit(6.2, 7.6, 0.8, 1.8, z + H, 0.16),
    ] };
  },
  coach() {
    const L = 11.5, W = 2.6, H = 3.3, z = 0.45;
    const bay = [{ u0: 3.3, u1: 5.2, v0: 0.3, v1: 1.05, c: 'panel', d: 1 }, { u0: 5.35, u1: 7.25, v0: 0.3, v1: 1.05, c: 'panel', d: 1 }];
    const glass = [0.5, 2.75, 5, 7.25].map((u) => win(u, u + 2.1, 1.75, 2.85));
    return { label: 'Intercity coach', livery: 'coral', len: L, top: z + H, pivot: [L / 2, W / 2], wheels: { r: 0.54, xs: [2.2, 8.6], y0: 0, y1: W }, boxes: [
      { x: [0, L], y: [0, W], z: [z, z + H], c: 'body', top: 'roof', faces: {
        left: [...band(L, 1.2, 0.25), ...bay, ...glass, ...doorAt(9.8, 10.9, 0.2, 2.85)],
        right: [...band(L, 1.2, 0.25), ...bay, ...glass, win(9.5, 10.9, 1.75, 2.85)],
        front: [{ u0: 0, u1: W, v0: 0.95, v1: 1.15, c: 'livery' }, bumper(W), win(0.2, 2.4, 1.35, 3), ...lamps(W, 0.4)],
        back: [...band(W, 1.2, 0.25), win(0.4, 2.2, 2, 2.85), ...tails(W, 0.5)],
      } },
      roofUnit(3, 6.5, 0.5, 2.1, z + H, 0.32),
    ] };
  },
  minibus() {
    const L = 5.3, W = 2.2, H = 2.35, z = 0.42;
    return { label: 'Minibus', livery: 'mint', len: L + 1, top: z + H, pivot: [3.15, W / 2], wheels: { r: 0.44, xs: [1.2, 4.7], y0: 0, y1: W }, boxes: [
      { x: [0, L], y: [0, W], z: [z, z + H], c: 'body', top: 'roof', faces: {
        left: [...band(L, 0.8, 0.22), win(0.4, 1.5, 1.15, 1.95), win(1.7, 2.8, 1.15, 1.95), ...doorAt(3, 4.1, 0.2, 2), win(4.3, 5.1, 1.15, 1.95)],
        right: [...band(L, 0.8, 0.22), ...[0.4, 1.7, 3].map((u) => win(u, u + 1.1, 1.15, 1.95)), win(4.3, 5.1, 1.15, 1.95)],
        front: [win(0.15, 2.05, 1.22, 2.02)],
        back: [...band(W, 0.8, 0.22), win(0.3, 1.9, 1.2, 1.95), ...tails(W, 0.35)],
      } },
      { x: [L, L + 1], y: [0, W], z: [z, z + 1.13], c: 'body', faces: { // bonnet
        left: band(1, 0.8, 0.22), right: band(1, 0.8, 0.22),
        front: [{ u0: 0, u1: W, v0: 0.8, v1: 1.02, c: 'livery' }, bumper(W), ...lamps(W, 0.34)],
      } },
    ] };
  },
  school() {
    const L = 7.2, W = 2.5, H = 2.6, z = 0.45;
    return { label: 'School bus', livery: 'sun', len: L + 1.1, top: z + H, pivot: [4.15, W / 2], wheels: { r: 0.5, xs: [1.6, 6.5], y0: 0, y1: W },
      pal: { body: '#F7CF52', roof: '#FBE49A', doorFrame: '#E8BC3A', livery: '#3B4652', accent: '#3B4652' }, boxes: [
        { x: [0, L], y: [0, W], z: [z, z + H], c: 'body', top: 'roof', faces: {
          left: [...band(L, 0.85, 0.14), ...[0.4, 1.7, 3, 4.3].map((u) => win(u, u + 1.1, 1.3, 2.1)), ...doorAt(5.8, 6.9, 0.2, 2.15)],
          right: [...band(L, 0.85, 0.14), ...[0.4, 1.7, 3, 4.3, 5.6].map((u) => win(u, u + 1.1, 1.3, 2.1))],
          front: [win(0.15, 2.35, 1.3, 2.15)],
          back: [...band(W, 0.85, 0.14), win(0.4, 2.1, 1.3, 2.1), ...tails(W, 0.4)],
        } },
        { x: [L, L + 1.1], y: [0, W], z: [z, z + 1.2], c: 'body', faces: { // bonnet
          left: band(1.1, 0.85, 0.14), right: band(1.1, 0.85, 0.14), front: [bumper(W), ...lamps(W, 0.4)],
        } },
        { x: [3.2, 3.8], y: [0.95, 1.55], z: [z + H, z + H + 0.25], c: 'tail', layer: 1, bevel: 0.05, d: 1 }, // roof beacon
      ] };
  },
  decker() {
    const L = 10, W = 2.6, H = 4.3, z = 0.45;
    const upper = [...[0.5, 2.1, 3.7, 5.3, 6.9].map((u) => win(u, u + 1.4, 2.55, 3.4)), win(8.5, 9.5, 2.55, 3.4)];
    return { label: 'Double-decker bus', livery: 'red', len: L, top: z + H, pivot: [L / 2, W / 2], wheels: { r: 0.52, xs: [2, 7.3], y0: 0, y1: W }, boxes: [
      { x: [0, L], y: [0, W], z: [z, z + H], c: 'body', top: 'roof', faces: {
        left: [...band(L, 2, 0.3), ...upper, win(0.5, 1.9, 1.05, 1.8), win(2.1, 3.5, 1.05, 1.8), ...doorAt(3.8, 5, 0.2, 1.85), win(5.3, 6.6, 1.05, 1.8), win(6.8, 8, 1.05, 1.8), ...doorAt(8.3, 9.5, 0.2, 1.85)],
        right: [...band(L, 2, 0.3), ...upper, ...[0.5, 2.1, 3.7, 5.3, 6.9].map((u) => win(u, u + 1.4, 1.05, 1.8)), win(8.5, 9.5, 1.05, 1.8)],
        front: [{ u0: 0, u1: W, v0: 2, v1: 2.3, c: 'livery' }, bumper(W), win(0.2, 2.4, 0.95, 1.85), win(0.2, 2.4, 2.55, 3.45), { u0: 0.45, u1: 2.15, v0: 3.65, v1: 3.95, c: 'board' }, ...lamps(W, 0.36)],
        back: [...band(W, 2, 0.3), win(0.4, 2.2, 2.6, 3.4), win(0.4, 2.2, 1.1, 1.8), ...tails(W, 0.45)],
      } },
    ] };
  },
  stop() {
    const mark = [{ u0: 0.17, u1: 0.77, v0: 0.4, v1: 0.9, c: 'signMark' }];
    return { label: 'Bus stop sign', len: 2.4, top: 4.5, pivot: [0.07, 0.07], prop: true, boxes: [
      { x: [0, 0.14], y: [0, 0.14], z: [0, 3.2], c: 'pole', bevel: 0.03 },
      { x: [-0.4, 0.54], y: [-0.02, 0.16], z: [3.2, 4.5], c: 'sign', layer: 1, bevel: 0.06, faces: { left: mark, right: mark } },
    ] };
  },
};
export const VEHICLES = Object.keys(MODELS);

// Status badges float above the roof. Always pair them with a text label in the UI.
const STATUS = {
  idle: { label: 'off duty', bg: '#FFFFFF', fg: '#1F5F85', glyph: (x, y, s) => `M${x - s} ${y - s}h${2 * s}l${-2 * s} ${2 * s}h${2 * s}` },
  maint: { label: 'needs attention', bg: '#FFB020', fg: '#1B1B1F', glyph: (x, y, s) => `M${x} ${y - 1.1 * s}V${y + 0.15 * s}M${x} ${y + 1.05 * s}v0.01` },
  off: { label: 'offline', bg: '#5B6673', fg: '#FFFFFF', pal: OFFLINE, glyph: (x, y, s) => `M${x - s} ${y - s}l${2 * s} ${2 * s}M${x + s} ${y - s}l${-2 * s} ${2 * s}` },
};

// Hero compositions on a two-lane road, left-hand traffic: [vehicle, x, y, heading, livery].
// Near lane (y ≈ 4.6) heads toward the lower right; far lane (y ≈ 0) heads away. The stop serves the far lane.
export const SCENES = {
  login: [['minibus', -9.5, 4.8, 0, 'mint'], ['bus', 0, 4.6, 0, 'teal'], ['coach', 5, 0, 180, 'coral'], ['stop', 2, -2.4, 0]],
  register: [['minibus', -9.5, 4.8, 0, 'violet'], ['decker', 0, 4.6, 0, 'red'], ['school', 6, 0, 180], ['stop', 2, -2.4, 0]],
  driver: [['bus', 0, 4.6, 0, 'teal'], ['minibus', 6, 0.2, 180, 'orange'], ['stop', 2, -2.4, 0]],
  admin: [['bus', -12.5, 4.6, 0, 'teal'], ['coach', 0, 4.6, 0, 'navy'], ['decker', 5.5, 0, 180, 'red'], ['stop', 2, -2.4, 0]],
};

// ── Renderer ─────────────────────────────────────────────────────────────────
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => `#${rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
const hull = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => list.reduce((h, q) => { while (h.length > 1 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); return h; }, []);
  const lo = half(p);
  const up = half(p.reverse());
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const r1 = (n) => Math.round(n * 10) / 10;

// models: [{ name, at, heading, livery, status, running }] → { prims: [[tag, props]], vb: [x, y, w, h] }
function project(models, { scale = UNIT, marker = false, ground = [], pad = 6 } = {}) {
  const pts = [];
  const raw = (p) => [(p[0] - p[1]) * C * scale, ((p[0] + p[1]) * S - p[2]) * scale];
  const P = (p) => { const q = raw(p); pts.push(q); return q; };
  const str = (a) => a.map((q) => `${r1(q[0])},${r1(q[1])}`).join(' ');
  const poly = (a, fill, sw = 0) => ['polygon', { points: str(a), fill, ...(sw ? { stroke: fill, strokeWidth: r1(sw), strokeLinejoin: 'round' } : null) }];
  const under = ground.map(([x0, x1, y0, y1, fill]) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => raw([x, y, 0])), fill));
  const shadows = [], contact = [], bodies = [];
  let centre = [0, 0];

  const ready = models.map((m) => ({ ...MODELS[m.name] ? MODELS[m.name]() : MODELS.bus(), ...m })).map((m) => ({ ...m, at: m.at || [0, 0] }));
  // Painter's order between models: whichever sits wholly nearer the viewer (larger y, then larger x) is drawn later.
  for (const m of ready) {
    const th = ((m.heading || 0) * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th), [px, py] = m.pivot;
    const corners = m.boxes.flatMap((b) => b.x.flatMap((x) => b.y.map((y) => [px + (x - px) * cs - (y - py) * sn + m.at[0], py + (x - px) * sn + (y - py) * cs + m.at[1]])));
    m.bb = [0, 1].flatMap((i) => [Math.min(...corners.map((c) => c[i])), Math.max(...corners.map((c) => c[i]))]); // [x0, x1, y0, y1]
  }
  ready.sort((p, q) => {
    if (p.bb[2] >= q.bb[3] - 0.01) return 1;
    if (q.bb[2] >= p.bb[3] - 0.01) return -1;
    if (p.bb[0] >= q.bb[1] - 0.01) return 1;
    if (q.bb[0] >= p.bb[1] - 0.01) return -1;
    return (p.bb[0] + p.bb[2]) - (q.bb[0] + q.bb[2]);
  });
  for (const m of ready) {
    const th = ((m.heading || 0) * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th), [px, py] = m.pivot, [ax, ay] = m.at;
    const T = ([x, y, z]) => [px + (x - px) * cs - (y - py) * sn + ax, py + (x - px) * sn + (y - py) * cs + ay, z];
    const N = ([nx, ny]) => [nx * cs - ny * sn, nx * sn + ny * cs];
    const st = (!m.prop && STATUS[m.status]) || null;
    const [stripe, line] = LIVERY[m.livery] || LIVERY.teal;
    const pal = { ...PALETTE, livery: stripe, accent: line, ...m.pal, ...(st && st.pal) };
    pal.lamp = m.running && !st ? pal.lampOn : pal.lampOff;
    const col = (k, amt) => mix(pal[k], SHADE, amt);
    const amtOf = (n) => { const [nx, ny] = N(n); return 0.07 + (0.17 * ((nx - ny) / Math.SQRT2 + 1)) / 2; };
    const vis = (n) => { const [nx, ny] = N(n); return nx + ny > 1e-6; };
    const out = [], pre = [], post = [], silhouette = [], cast = [], foots = [];
    centre = raw(T([px, py, m.top / 2]));

    const boxes = m.boxes.filter((b) => !(marker && b.d));
    for (const b of boxes) {
      const foot = [[b.x[0], b.y[0]], [b.x[1], b.y[0]], [b.x[1], b.y[1]], [b.x[0], b.y[1]]].map(([x, y]) => T([x, y, 0]));
      const own = b.z.flatMap((z) => foot.map(([x, y]) => P([x + SV[0] * z, y + SV[1] * z, 0])));
      if (m.prop) shadows.push(poly(hull(own), SHADOW)); else cast.push(...own);
      if (b.z[0] < 1 && !m.prop) foots.push(...foot.map(P));
    }
    // One hull per bus so overlapping translucent shadows never double up.
    if (cast.length) shadows.push(poly(hull(cast), SHADOW));
    if (foots.length) contact.push(poly(hull(foots), SHADOW, 0.2 * scale));

    if (!m.prop && !marker) { // headroom for the badge and the motion lines is always reserved, so states never resize the art
      const [bx, by] = P(T([px, py, m.top + 1.9]));
      pts.push([bx - 1.1 * scale, by - 1.1 * scale], [bx + 1.1 * scale, by + 1.1 * scale]);
      const tailsAt = [[-0.7, -0.5, -2.6], [0.7, -0.5, -2], [0, -1.1, -3.2]].map(([dy, a, b]) => [a, b].map((x) => P(T([x, py + dy, 0]))));
      if (m.running && !st) for (const [p, q] of tailsAt) out.push(['path', { d: `M${str([p])}L${str([q])}`, fill: 'none', stroke: '#A5D8F3', strokeWidth: r1(0.13 * scale), strokeLinecap: 'round' }]);
      if (st) post.push(['circle', { cx: r1(bx), cy: r1(by), r: r1(0.95 * scale), fill: st.bg }],
        ['path', { d: st.glyph(r1(bx), r1(by), r1(0.4 * scale)), fill: 'none', stroke: st.fg, strokeWidth: r1(0.2 * scale), strokeLinecap: 'round', strokeLinejoin: 'round' }]);
    }

    const depth = (b) => { const c = T([(b.x[0] + b.x[1]) / 2, (b.y[0] + b.y[1]) / 2, 0]); return (b.layer || 0) * 1000 + c[0] + c[1]; };
    const faceList = [];
    for (const b of [...boxes].sort((a, c) => depth(a) - depth(c))) {
      const [x0, x1] = b.x, [y0, y1] = b.y, [z0, z1] = b.z, h = z1 - z0, sw = (b.bevel || 0.1) * scale * (marker ? 0.6 : 1);
      const faces = [
        ['back', [-1, 0], (u, v) => [x0, y0 + u, z0 + v], y1 - y0, h], ['right', [0, -1], (u, v) => [x0 + u, y0, z0 + v], x1 - x0, h],
        ['front', [1, 0], (u, v) => [x1, y0 + u, z0 + v], y1 - y0, h], ['left', [0, 1], (u, v) => [x0 + u, y1, z0 + v], x1 - x0, h],
        ['top', null, (u, v) => [x0 + u, y0 + v, z1], x1 - x0, y1 - y0],
      ];
      for (const [k, n, f, w, hh] of faces) {
        if (n && !vis(n)) continue;
        const amt = n ? amtOf(n) : 0;
        const rect = (u0, u1, v0, v1) => [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)].map((p) => P(T(p)));
        const face = rect(0, w, 0, hh);
        silhouette.push(...face);
        faceList.push(poly(face, col(k === 'top' && b.top ? b.top : b.c, amt), sw));
        for (const d of (b.faces && b.faces[k]) || []) {
          if (marker && d.d) continue;
          faceList.push(poly(rect(d.u0, d.u1, d.v0, d.v1), col(d.c, amt)));
          if (d.c === 'glass' && !marker) faceList.push(poly(rect(d.u0, d.u1, d.v1 - (d.v1 - d.v0) * 0.3, d.v1), mix(col('glass', amt), '#FFFFFF', 0.22)));
        }
      }
    }

    const wh = m.wheels;
    if (wh) for (const wx of wh.xs) for (const [yo, n, dir] of [[wh.y1 + 0.03, [0, 1], -1], [wh.y0 - 0.03, [0, -1], 1]]) {
      const ring = (y, r) => Array.from({ length: 16 }, (_, i) => P(T([wx + r * Math.cos((i * Math.PI) / 8), y, wh.r + r * Math.sin((i * Math.PI) / 8)])));
      // Tyre tread goes under the body; only the outward face of a near-side wheel is drawn over it.
      pre.push(poly(hull([...ring(yo, wh.r), ...ring(yo + dir * 0.5, wh.r)]), mix(pal.tire, '#000000', 0.25)));
      if (vis(n)) faceList.push(poly(ring(yo, wh.r), col('tire', 0)), poly(ring(yo, wh.r * 0.5), col('hub', amtOf(n))));
    }
    const halo = marker ? [['polygon', { points: str(hull(silhouette)), fill: '#FFFFFF', stroke: '#FFFFFF', strokeWidth: r1(0.75 * scale), strokeLinejoin: 'round' }]] : [];
    bodies.push(...halo, ...pre, ...out, ...faceList, ...post);
  }

  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const side = marker && ready[0].len * 1.32 * scale;
  const vb = marker ? [centre[0] - side / 2, centre[1] - side / 2, side, side]
    : [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + 2 * pad, Math.max(...ys) - Math.min(...ys) + 2 * pad];
  return { prims: [...under, ...shadows, ...contact, ...bodies], vb: vb.map(r1) };
}

const cache = new Map();
const memo = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };

// One bus or prop. opts: heading (deg, 45° steps look best), livery, status ('idle'|'maint'|'off'), running, marker.
export function build(name, { heading = 0, livery, status, running = false, marker = false } = {}) {
  const key = MODELS[name] ? name : 'bus';
  return memo([key, heading, livery, status, running, marker].join('|'), () => {
    const m = MODELS[key]();
    const st = STATUS[status];
    return { ...project([{ name: key, heading, livery: livery || m.livery, status, running }], { marker }), label: st && !m.prop ? `${m.label}, ${st.label}` : m.label };
  });
}

// A hero scene: several buses and a stop sign on a two-lane road. Meant for the brand-teal hero panels.
export function buildScene(scene = 'login') {
  return memo(`scene|${scene}`, () => {
    const dashes = Array.from({ length: 34 }, (_, i) => [-52 + i * 3.4, -50.2 + i * 3.4, 3.45, 3.75, 'rgba(255,255,255,0.75)']);
    return project((SCENES[scene] || SCENES.login).map(([name, x, y, heading, livery]) => ({ name, at: [x, y], heading, ...(livery && { livery }) })),
      { ground: [[-60, 70, -1, 8.2, 'rgba(31,95,133,0.55)'], ...dashes], pad: 10 });
  });
}

// GPS heading (degrees clockwise from north) → model heading snapped to the 8 drawn directions. No heading → three-quarter view.
export const headingFor = (gps) => (gps == null || Number.isNaN(Number(gps)) ? 0 : ((Math.round((225 + Number(gps)) / 45) % 8) + 8) % 8 * 45);

const kebab = (k) => k.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
// Plain SVG string (Leaflet markers, anything non-React). `size` is the width in px.
export function vehicleSvgString(name, { size = 56, ...opts } = {}) {
  const { prims, vb, label } = build(name, opts);
  const inner = prims.map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${kebab(k)}="${v}"`).join(' ')}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round((size * vb[3]) / vb[2])}" viewBox="${vb.join(' ')}" role="img" aria-label="${label}">${inner}</svg>`;
}
