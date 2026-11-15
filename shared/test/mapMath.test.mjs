// The phone map's maths (shared/native/mapMath.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE, fitView, project, tilesFor, toWorld } from '../native/mapMath.js';

const PAD = { left: 32, right: 32, top: 40, bottom: 40 };

test('the world map is one tile at zoom 0, with the origin of the map in its middle', () => {
  assert.deepEqual(toWorld(0, 0, 0), { x: 128, y: 128 });
  assert.equal(toWorld(0, -180, 3).x, 0);
});

test('north is up and east is right', () => {
  const a = toWorld(6.9, 79.8, 12);
  const b = toWorld(7.0, 79.9, 12);
  assert.ok(b.y < a.y && b.x > a.x);
});

test('every point of a route lands inside the padded screen', () => {
  const points = [[6.93, 79.85], [6.9, 79.9], [6.84, 80.0], [6.88, 79.95]];
  const view = fitView(points, 400, 800, PAD);
  for (const [lat, lng] of points) {
    const p = project(lat, lng, view);
    assert.ok(p.x >= PAD.left - 1 && p.x <= 400 - PAD.right + 1, `x ${p.x}`);
    assert.ok(p.y >= PAD.top - 1 && p.y <= 800 - PAD.bottom + 1, `y ${p.y}`);
  }
});

test('the route is shown as large as fits: one zoom more would not fit', () => {
  const points = [[6.93, 79.85], [6.84, 80.0]];
  const { zoom } = fitView(points, 400, 800, PAD);
  const a = toWorld(6.93, 79.85, zoom + 1);
  const b = toWorld(6.84, 80.0, zoom + 1);
  assert.ok(b.x - a.x > 400 - PAD.left - PAD.right || b.y - a.y > 800 - PAD.top - PAD.bottom);
});

test('no points shows Colombo', () => {
  const view = fitView([], 400, 800, PAD);
  const p = project(6.9, 79.87, view);
  assert.ok(Math.abs(p.x - 200) < 2 && Math.abs(p.y - 400) < 2);
});

test('the tiles cover the whole screen, no more than needed', () => {
  const view = fitView([[6.93, 79.85], [6.84, 80.0]], 400, 800, PAD);
  const tiles = tilesFor(view, 400, 800);
  assert.ok(tiles.length > 0 && tiles.length < 40);
  assert.ok(Math.min(...tiles.map((t) => t.left)) <= 0 && Math.max(...tiles.map((t) => t.left)) + TILE >= 400);
  assert.ok(Math.min(...tiles.map((t) => t.top)) <= 0 && Math.max(...tiles.map((t) => t.top)) + TILE >= 800);
  assert.equal(new Set(tiles.map((t) => t.key)).size, tiles.length);
});
