// Map maths for the phone apps' native map (LiveMap.native.js): Web Mercator, the same tiling every slippy map uses.
// Pure functions, no React Native, so they are tested on their own (shared/test/mapMath.test.mjs).
// Source of truth: /shared/native/mapMath.js (copied into each app by `node shared/sync.js`).

export const TILE = 256; // size of the world map at zoom 0, in map pixels (the unit of `view.origin` and of project())
// Tiles are fetched one zoom level finer than the view and drawn at half size, so a 256 px tile image fills 128 map pixels:
// sharp on a phone screen, which has about two device pixels per map pixel.
const MIN_ZOOM = 3;
const MAX_ZOOM = 15; // the highest zoom fitView picks for a route
export const MAX_VIEW_ZOOM = 16; // the most a passenger can zoom in; the tile server has no tiles finer than 16, so past 15 they enlarge
const MAX_TILE_ZOOM = 16;
const MAX_TILES = 150; // a screen never needs more; a guard against a bad size
const COLOMBO = [6.9, 79.87];

const clampLat = (lat) => Math.max(-85.0511, Math.min(85.0511, lat));

// Position of a point on the whole world map at a zoom level, in pixels (x to the east, y to the south).
export function toWorld(lat, lng, zoom) {
  const size = TILE * 2 ** zoom;
  const rad = (clampLat(lat) * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * size,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * size,
  };
}

// The view that shows every point ([[lat, lng], ...]) inside the screen minus its padding: the highest zoom that fits, and
// the world position of the screen's top-left corner (`origin`). Without points it shows Colombo.
export function fitView(points, width, height, pad) {
  const w = Math.max(40, width - pad.left - pad.right);
  const h = Math.max(40, height - pad.top - pad.bottom);
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const box = points.length
    ? { south: Math.min(...lats), north: Math.max(...lats), west: Math.min(...lngs), east: Math.max(...lngs) }
    : { south: COLOMBO[0], north: COLOMBO[0], west: COLOMBO[1], east: COLOMBO[1] };
  let zoom = points.length ? MAX_ZOOM : 12;
  const corners = (z) => [toWorld(box.north, box.west, z), toWorld(box.south, box.east, z)];
  while (zoom > MIN_ZOOM) {
    const [a, b] = corners(zoom);
    if (b.x - a.x <= w && b.y - a.y <= h) break;
    zoom -= 1;
  }
  const [a, b] = corners(zoom);
  const target = { x: pad.left + w / 2, y: pad.top + h / 2 }; // where the middle of the points should land on screen
  return { zoom, origin: { x: Math.round((a.x + b.x) / 2 - target.x), y: Math.round((a.y + b.y) / 2 - target.y) } };
}

// Where a latitude and longitude land on the screen in this view.
export function project(lat, lng, view) {
  const p = toWorld(lat, lng, view.zoom);
  return { x: p.x - view.origin.x, y: p.y - view.origin.y };
}

// The view after a pan and/or pinch: the map point that was under `from` (a screen position) ends up under `to`, and the zoom
// changes by `scale` (2 = twice as large). The zoom is kept between the lowest and highest the map allows.
export function moveView(base, from, to, scale = 1) {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_VIEW_ZOOM, base.zoom + Math.log2(scale)));
  const k = 2 ** (zoom - base.zoom);
  return { zoom, origin: { x: (base.origin.x + from.x) * k - to.x, y: (base.origin.y + from.y) * k - to.y } };
}

// The tiles that cover the screen: [{ key, x, y, zoom, size, left, top }] with left, top and size in screen pixels. The view zoom
// can be fractional (mid-pinch); the tiles come from the nearest finer whole zoom and are scaled to fit.
export function tilesFor(view, width, height) {
  const zoom = Math.min(MAX_TILE_ZOOM, Math.max(1, Math.round(view.zoom) + 1));
  const count = 2 ** zoom;
  const size = TILE * 2 ** (view.zoom - zoom); // 128 when the view zoom is whole
  const first = { x: Math.floor(view.origin.x / size), y: Math.max(0, Math.floor(view.origin.y / size)) };
  const last = { x: Math.floor((view.origin.x + width) / size), y: Math.min(count - 1, Math.floor((view.origin.y + height) / size)) };
  const tiles = [];
  for (let y = first.y; y <= last.y; y += 1) {
    for (let x = first.x; x <= last.x; x += 1) {
      const wrapped = ((x % count) + count) % count; // the map repeats east-west
      tiles.push({ key: `${zoom}/${x}/${y}`, x: wrapped, y, zoom, size, left: x * size - view.origin.x, top: y * size - view.origin.y });
    }
  }
  return tiles.slice(0, MAX_TILES);
}
