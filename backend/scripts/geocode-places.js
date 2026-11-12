// Looks up coordinates for every stop name in data/routes.js and writes data/places.json.
// Usage: node scripts/geocode-places.js            (only looks up names that are not in places.json yet)
//        node scripts/geocode-places.js --all      (looks everything up again)
// Uses OpenStreetMap's public Nominatim service, limited to the Colombo area and to one request a second, as its usage
// policy asks. Only place names are sent. Review the result: places.json is committed so the seed never needs the network
// for coordinates, and any wrong point can be corrected by hand there.
const fs = require('fs');
const path = require('path');
const { ROUTES, SEARCH_AS, MANUAL } = require('./data/routes');

const FILE = path.join(__dirname, 'data', 'places.json');
const BOX = '79.78,7.20,80.14,6.68'; // west,north,east,south: Colombo and its suburbs out to Avissawella/Katunayake
const redo = process.argv.includes('--all');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function lookup(name) {
  const q = SEARCH_AS[name] || `${name}, Sri Lanka`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=lk&viewbox=${BOX}&bounded=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'bus-tracking-student-project/1.0' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const hit = (await res.json())[0];
  return hit ? { lat: Math.round(Number(hit.lat) * 1e5) / 1e5, lng: Math.round(Number(hit.lon) * 1e5) / 1e5, found: hit.display_name.split(',').slice(0, 3).join(',').trim() } : null;
}

(async () => {
  const places = fs.existsSync(FILE) && !redo ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
  const names = [...new Set(ROUTES.flatMap((r) => r.stops))];
  for (const name of names) {
    if (MANUAL[name]) { places[name] = MANUAL[name]; console.log(`manual  ${name}`); continue; }
    if (places[name]) continue;
    try {
      places[name] = await lookup(name);
      console.log(places[name] ? `ok      ${name} -> ${places[name].lat}, ${places[name].lng}  (${places[name].found})` : `MISSING ${name}`);
    } catch (err) {
      console.log(`ERROR   ${name}: ${err.message}`);
    }
    await sleep(1100);
  }
  fs.writeFileSync(FILE, JSON.stringify(places, null, 2) + '\n');
  const missing = names.filter((n) => !places[n]);
  console.log(`\n${names.length - missing.length}/${names.length} places located${missing.length ? `. Missing: ${missing.join(', ')}` : '.'}`);
})();
