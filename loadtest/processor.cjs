// Artillery helper: gives each virtual driver a signed token and a moving position along the route.
// Tokens are signed by the backend's own auth module, so JWT_SECRET must match the server's (same default when unset).
const crypto = require('crypto');
const { signToken, driverClaims } = require('../backend/lib/auth');
const { fromLineString } = require('../backend/lib/geo');

const ROUTE_ID = process.env.ROUTE_ID;
const TARGET = process.env.TARGET || 'http://localhost:5000';
let linePromise = null;

const loadLine = () => {
  linePromise = linePromise || fetch(`${TARGET}/api/routes`).then((r) => r.json()).then((routes) => {
    const route = routes.find((r) => r.routeId === ROUTE_ID);
    if (!route?.path?.coordinates?.length) throw new Error(`Route ${ROUTE_ID} not found or has no path (set ROUTE_ID, run "npm run seed")`);
    return fromLineString(route.path.coordinates); // [lat, lng]
  });
  return linePromise;
};

async function initDriver(context) {
  const busId = `LOAD-${crypto.randomUUID().slice(0, 8)}`;
  context.vars.token = signToken(driverClaims({ busId, registration: busId }, { routeId: ROUTE_ID }, 'Load test'), '1h');
  context.vars.line = await loadLine();
  context.vars.pos = Math.floor(Math.random() * context.vars.line.length * 0.5);
}

async function nextFix(context) {
  const { line } = context.vars;
  context.vars.pos = (context.vars.pos + 1) % line.length; // one path vertex per fix (~30 m on the seeded route)
  const [lat, lng] = line[context.vars.pos];
  context.vars.lat = lat;
  context.vars.lng = lng;
  context.vars.ts = Date.now();
}

module.exports = { initDriver, nextFix };
