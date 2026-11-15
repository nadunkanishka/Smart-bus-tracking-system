// The phone map's maths (shared/native/mapMath.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_VIEW_ZOOM, fitView, moveView, project, tilesFor, toWorld } from '../native/mapMath.js';

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
  assert.ok(tiles.length > 0 && tiles.length < 100);
  assert.ok(Math.min(...tiles.map((t) => t.left)) <= 0 && Math.max(...tiles.map((t) => t.left)) + tiles[0].size >= 400);
  assert.ok(Math.min(...tiles.map((t) => t.top)) <= 0 && Math.max(...tiles.map((t) => t.top)) + tiles[0].size >= 800);
  assert.equal(new Set(tiles.map((t) => t.key)).size, tiles.length);
});

test('tiles are fetched one zoom finer than the view, never finer than the server has', () => {
  const view = fitView([[6.9344, 79.8506], [6.9345, 79.8507]], 400, 800, PAD);
  assert.equal(tilesFor(view, 400, 800)[0].zoom, view.zoom + 1);
  assert.ok(view.zoom + 1 <= 16);
});

const BASE = fitView([[6.93, 79.85], [6.84, 80.0]], 400, 800, PAD);

test('dragging moves the map by the finger movement and keeps the zoom', () => {
  const moved = moveView(BASE, { x: 200, y: 400 }, { x: 230, y: 380 });
  assert.equal(moved.zoom, BASE.zoom);
  assert.equal(moved.origin.x, BASE.origin.x - 30);
  assert.equal(moved.origin.y, BASE.origin.y + 20);
});

test('pinching keeps the map point under the fingers where it was', () => {
  const finger = { x: 150, y: 300 };
  const before = BASE.origin.x + finger.x; // world x under the fingers
  const zoomed = moveView(BASE, finger, finger, 2);
  assert.equal(zoomed.zoom, BASE.zoom + 1);
  assert.ok(Math.abs((zoomed.origin.x + finger.x) - before * 2) < 1e-6);
});

test('zoom stays within what the map allows', () => {
  assert.equal(moveView(BASE, { x: 0, y: 0 }, { x: 0, y: 0 }, 2 ** 20).zoom, MAX_VIEW_ZOOM);
  assert.equal(moveView(BASE, { x: 0, y: 0 }, { x: 0, y: 0 }, 2 ** -20).zoom, 3);
});

test('a half-way zoom still gets tiles that cover the screen', () => {
  const mid = moveView(BASE, { x: 200, y: 400 }, { x: 200, y: 400 }, 1.4);
  const tiles = tilesFor(mid, 400, 800);
  assert.ok(tiles.length > 0 && Number.isInteger(tiles[0].zoom) && tiles[0].size > 0);
  assert.ok(Math.min(...tiles.map((t) => t.left)) <= 0 && Math.max(...tiles.map((t) => t.left)) + tiles[0].size >= 400);
});
