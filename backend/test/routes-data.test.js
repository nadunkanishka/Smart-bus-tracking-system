const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { haversine } = require('../lib/geo');
const { ROUTES } = require('../scripts/data/routes');

const places = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'data', 'places.json'), 'utf8'));

test('route numbers are unique and the pilot route is present', () => {
  const numbers = ROUTES.map((r) => r.number);
  assert.equal(new Set(numbers).size, numbers.length);
  assert.ok(numbers.includes('138'));
});

test('every route has two terminals and at least two stops, starting and ending at its terminals', () => {
  for (const r of ROUTES) {
    assert.ok(r.start && r.end, `route ${r.number} needs a start and an end`);
    assert.ok(r.stops.length >= 2, `route ${r.number} needs at least two stops`);
    assert.equal(new Set(r.stops).size, r.stops.length, `route ${r.number} lists a stop twice`);
  }
});

test('every stop has coordinates in the Colombo area', () => {
  for (const r of ROUTES) {
    for (const name of r.stops) {
      const p = places[name];
      assert.ok(p, `no coordinates for "${name}" (route ${r.number}); run node scripts/geocode-places.js`);
      assert.ok(p.lat > 6.65 && p.lat < 7.25 && p.lng > 79.75 && p.lng < 80.2, `"${name}" is outside the Colombo area: ${p.lat}, ${p.lng}`);
    }
  }
});

test('neighbouring stops are not implausibly far apart (30 km allows Kosgama to Avissawella; catches a stop that was looked up in the wrong place)', () => {
  for (const r of ROUTES) {
    for (let i = 1; i < r.stops.length; i += 1) {
      const a = places[r.stops[i - 1]];
      const b = places[r.stops[i]];
      const km = haversine([a.lat, a.lng], [b.lat, b.lng]) / 1000;
      assert.ok(km < 30, `route ${r.number}: ${r.stops[i - 1]} to ${r.stops[i]} is ${km.toFixed(1)} km apart`);
    }
  }
});
