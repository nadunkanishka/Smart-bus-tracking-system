// Calls every REST endpoint in a fixed order, checks each status code, and prints one line per call with volatile
// values masked, so two runs can be diffed. Exits 1 when any status differs from the expected one, and stops at once
// when a record the later calls need could not be created. Run against an EMPTY throwaway database, never your real one:
//   PORT=5050 MONGODB_URI=mongodb://127.0.0.1:27017/smartbus_smoke ADMIN_PASSWORD=smoke-pass node index.js
//   node scripts/smoke.js --url http://localhost:5050 --password smoke-pass > out.txt
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const URL = arg('url', 'http://localhost:5050');
const ADMIN_PASSWORD = arg('password', 'smoke-pass');

const VOLATILE = new Set(['_id', 'id', 'token', 'createdAt', 'updatedAt', 'serverTs', 'uptimeSec', 'password']);
const mask = (v, key) => {
  if (Array.isArray(v)) return v.map((x) => mask(x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, mask(v[k], k)]));
  return VOLATILE.has(key) && v !== null && v !== '' ? `<${key}>` : v;
};

const failures = [];

async function call(label, expect, method, path, { token, body } = {}) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.replace(/\s+/g, ' ').slice(0, 120); }
  const ok = res.status === expect;
  if (!ok) failures.push(`${label}: expected ${expect}, got ${res.status}`);
  console.log(`${label} | ${method} ${path} | ${res.status}${ok ? '' : ` (expected ${expect})`} | ${JSON.stringify(mask(data))}`);
  return data;
}

// A value later calls depend on (a token, a new record's id). Without it the rest of the run would test nothing.
const need = (value, what) => {
  if (value === undefined || value === null || value === '') throw new Error(`${what} is missing: stopping here`);
  return value;
};

(async () => {
  const path = [[6.9, 79.86], [6.91, 79.87], [6.92, 79.88]];
  const stopPoints = [{ name: 'Fort', lat: 6.9, lng: 79.86 }, { name: 'Town Hall', lat: 6.91, lng: 79.87 }, { name: 'Borella', lat: 6.92, lng: 79.88 }];

  await call('health', 200, 'GET', '/api/health');
  await call('unknown path', 404, 'GET', '/api/nope');

  await call('admin login: empty', 400, 'POST', '/api/auth/login', { body: {} });
  await call('admin login: wrong', 401, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'nope' } });
  const admin = need((await call('admin login: ok', 200, 'POST', '/api/auth/login', { body: { username: 'admin', password: ADMIN_PASSWORD } })).token, 'admin token');

  await call('passenger register: bad username', 400, 'POST', '/api/passengers/register', { body: { username: 'x', password: 'secret1', name: 'A' } });
  await call('passenger register: short password', 400, 'POST', '/api/passengers/register', { body: { username: 'smoke.user', password: '123', name: 'A' } });
  await call('passenger register: no name', 400, 'POST', '/api/passengers/register', { body: { username: 'smoke.user', password: 'secret1' } });
  await call('passenger register: ok', 201, 'POST', '/api/passengers/register', { body: { username: 'Smoke.User', password: 'secret1', name: 'Smoke User', phone: '0771234567' } });
  await call('passenger register: duplicate', 409, 'POST', '/api/passengers/register', { body: { username: 'smoke.user', password: 'secret1', name: 'Again' } });
  await call('passenger login: empty', 400, 'POST', '/api/passengers/login', { body: {} });
  await call('passenger login: wrong', 401, 'POST', '/api/passengers/login', { body: { username: 'smoke.user', password: 'nope' } });
  const passenger = need((await call('passenger login: ok', 200, 'POST', '/api/passengers/login', { body: { username: 'smoke.user', password: 'secret1' } })).token, 'passenger token');

  for (const p of ['/api/dashboard/summary', '/api/drivers', '/api/buses', '/api/live', '/api/metrics', '/api/analytics/eta']) {
    await call('guard: no token', 401, 'GET', p);
    await call('guard: passenger token', 403, 'GET', p, { token: passenger });
  }
  await call('guard: bad token', 401, 'GET', '/api/drivers', { token: 'not-a-token' });
  await call('guard: route write without token', 401, 'POST', '/api/routes', { body: { name: 'x' } });
  await call('guard: route write as passenger', 403, 'DELETE', '/api/routes/RT-001', { token: passenger });

  await call('summary: empty', 200, 'GET', '/api/dashboard/summary', { token: admin });

  await call('drivers: empty', 200, 'GET', '/api/drivers', { token: admin });
  await call('drivers: create invalid', 400, 'POST', '/api/drivers', { token: admin, body: { name: 'No Licence' } });
  const driverId = need((await call('drivers: create', 201, 'POST', '/api/drivers', { token: admin, body: { name: 'Kamal Perera', license: 'B1234567', expiry: '2030-01-01', phone: '0711111111' } })).driverId, 'new driver id');
  await call('drivers: update', 200, 'PUT', `/api/drivers/${driverId}`, { token: admin, body: { status: 'On Leave' } });
  await call('drivers: update bad status', 400, 'PUT', `/api/drivers/${driverId}`, { token: admin, body: { status: 'Flying' } });
  await call('drivers: update unknown', 404, 'PUT', '/api/drivers/DRV-999', { token: admin, body: { status: 'Active' } });
  await call('drivers: list', 200, 'GET', '/api/drivers', { token: admin });

  await call('buses: create invalid', 400, 'POST', '/api/buses', { token: admin, body: { capacity: 40 } });
  const busId = need((await call('buses: create', 201, 'POST', '/api/buses', { token: admin, body: { registration: 'NB-4712', capacity: '52', mileage: '12000', password: 'bus-pass', assignedDriver: driverId } })).busId, 'new bus id');
  await call('buses: update keeps password', 200, 'PUT', `/api/buses/${busId}`, { token: admin, body: { mileage: '12500', password: '', hasPassword: true } });
  await call('buses: update unknown', 404, 'PUT', '/api/buses/BUS-999', { token: admin, body: { mileage: 1 } });
  await call('buses: list', 200, 'GET', '/api/buses', { token: admin });

  await call('driver login: empty', 400, 'POST', '/api/auth/driver-login', { body: {} });
  await call('driver login: unknown bus', 404, 'POST', '/api/auth/driver-login', { body: { registration: 'ZZ-0000', password: 'x' } });
  await call('driver login: wrong password', 401, 'POST', '/api/auth/driver-login', { body: { registration: 'NB-4712', password: 'x' } });
  await call('driver login: ok, no route', 200, 'POST', '/api/auth/driver-login', { body: { registration: 'NB-4712', password: 'bus-pass' } });

  await call('routes: public list, empty', 200, 'GET', '/api/routes');
  await call('routes: create invalid', 400, 'POST', '/api/routes', { token: admin, body: { name: 'No terminals' } });
  await call('routes: create bad path', 400, 'POST', '/api/routes', { token: admin, body: { name: 'R', start: 'A', end: 'B', distance: 5, path: [[6.9, 79.86]] } });
  await call('routes: create unnamed stop', 400, 'POST', '/api/routes', { token: admin, body: { name: 'R', start: 'A', end: 'B', distance: 5, stopPoints: [{ lat: 6.9, lng: 79.86 }] } });
  const routeId = need((await call('routes: create', 201, 'POST', '/api/routes', { token: admin, body: { name: 'Fort - Borella', start: 'Fort', end: 'Borella', distance: '6.5', routeNumber: '138', assignedBus: 'NB-4712', path, stopPoints } })).routeId, 'new route id');
  await call('routes: update', 200, 'PUT', `/api/routes/${routeId}`, { token: admin, body: { distance: '7', stops: 'not-an-array' } });
  await call('routes: update unknown', 404, 'PUT', '/api/routes/RT-999', { token: admin, body: { distance: 1 } });
  await call('routes: public list', 200, 'GET', '/api/routes');
  await call('routes: live buses', 200, 'GET', `/api/routes/${routeId}/buses`);
  await call('driver login: ok, with route', 200, 'POST', '/api/auth/driver-login', { body: { busId, password: 'bus-pass' } });

  await call('summary', 200, 'GET', '/api/dashboard/summary', { token: admin });
  await call('live', 200, 'GET', '/api/live', { token: admin });
  await call('metrics', 200, 'GET', '/api/metrics', { token: admin });
  await call('analytics segments: unknown route', 404, 'GET', '/api/analytics/segments?routeId=RT-999', { token: admin });
  await call('analytics segments', 200, 'GET', `/api/analytics/segments?routeId=${routeId}`, { token: admin });
  await call('analytics eta', 200, 'GET', `/api/analytics/eta?routeId=${routeId}`, { token: admin });
  await call('analytics eta: all routes', 200, 'GET', '/api/analytics/eta', { token: admin });

  await call('routes: clear path', 200, 'PUT', `/api/routes/${routeId}`, { token: admin, body: { path: [] } });
  await call('routes: delete', 200, 'DELETE', `/api/routes/${routeId}`, { token: admin });
  await call('routes: delete again', 404, 'DELETE', `/api/routes/${routeId}`, { token: admin });
  await call('buses: delete by registration', 200, 'DELETE', '/api/buses/NB-4712', { token: admin });
  await call('buses: delete again', 404, 'DELETE', `/api/buses/${busId}`, { token: admin });
  await call('drivers: delete', 200, 'DELETE', `/api/drivers/${driverId}`, { token: admin });
  await call('drivers: delete again', 404, 'DELETE', `/api/drivers/${driverId}`, { token: admin });
})()
  .catch((err) => { failures.push(err.message); })
  .finally(() => {
    if (!failures.length) return;
    console.error(`\nSMOKE FAILED (${failures.length}):\n  ${failures.join('\n  ')}`);
    process.exitCode = 1;
  });
