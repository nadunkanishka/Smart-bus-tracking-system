// GPS smoothing: a constant-velocity Kalman filter per bus, with spike gating and a stopped-bus hold.
// Pure functions, no I/O. The interim report promises "Kalman / distance-threshold smoothing"; this is that, in three parts:
//   1. Kalman filter (east and north separately): blends each fix with where the bus should be by now, trusting the fix
//      less when the phone reports a poor accuracy. This takes the 10-25 m jitter out of the track.
//   2. Spike gate: a fix far from the prediction is skipped, but never more than `maxSkips` in a row, so a real turn
//      or a real jump is followed after at most two fixes.
//   3. Stop hold: a bus that reports it is not moving does not wander about its stop.
// The raw fix is never thrown away: realtime.js logs it beside the smoothed point.
const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

// Tune here. Everything the filter does is set by these numbers.
const SMOOTHING = {
  accelSigma: 1.0, // m/s^2: how hard a bus can speed up, brake or turn. Higher follows turns faster, lower smooths more.
  defaultAccuracyM: 15, // used when the phone gives no accuracy figure
  minAccuracyM: 5, // never trust a fix to better than this, whatever the phone claims
  gateSigma: 4, // a fix this many standard deviations from the prediction is a suspected spike
  maxSkips: 2, // ...and is skipped, but never more than this many fixes in a row
  holdSpeedMps: 0.5, // device speed below this means the bus is stopped
  turnGateSigma: 2, // fixes missing the prediction by more than this many standard deviations suggest a turn...
  turnBoost: 6, // ...so the next prediction allows this many times more change of course
  stoppedAccelFactor: 0.05, // while stopped, trust the prediction ("still here") much more: acceleration noise is scaled by this
  resetGapSec: 30, // after a gap this long (signal lost, offline buffer) start again from the next fix
};

const toXY = (st, lat, lng) => [rad(lng - st.lng0) * R * Math.cos(rad(st.lat0)), rad(lat - st.lat0) * R];
const toLatLng = (st, x, y) => [st.lat0 + ((y / R) * 180) / Math.PI, st.lng0 + ((x / (R * Math.cos(rad(st.lat0)))) * 180) / Math.PI];

function axis(pos, vel, r) {
  return { pos, vel, p00: r, p01: 0, p11: 225 }; // velocity starts uncertain (15 m/s)
}

function predict(a, dt, q) {
  a.pos += a.vel * dt;
  a.p00 += dt * (2 * a.p01 + dt * a.p11) + (q * dt ** 4) / 4;
  a.p01 += dt * a.p11 + (q * dt ** 3) / 2;
  a.p11 += q * dt * dt;
}

function update(a, z, r) {
  const s = a.p00 + r;
  const k0 = a.p00 / s;
  const k1 = a.p01 / s;
  const y = z - a.pos;
  a.pos += k0 * y;
  a.vel += k1 * y;
  a.p11 -= k1 * a.p01;
  a.p01 -= k0 * a.p01;
  a.p00 -= k0 * a.p00;
}

// state: null for a bus's first fix, otherwise what this returned before. fix: { lat, lng, ts (ms), speed (m/s), heading, accuracy (m) }.
// Returns { state, lat, lng, skipped, held }. With cfg.enabled === false it returns the fix unchanged.
function smoothFix(state, fix, cfg = SMOOTHING) {
  if (cfg.enabled === false) return { state: null, lat: fix.lat, lng: fix.lng, skipped: false, held: false };
  const acc = Math.max(cfg.minAccuracyM, Number.isFinite(fix.accuracy) && fix.accuracy > 0 ? fix.accuracy : cfg.defaultAccuracyM);
  const r = acc * acc;
  const moving = fix.speed >= cfg.holdSpeedMps;

  if (!state || (fix.ts - state.ts) / 1000 > cfg.resetGapSec || fix.ts <= state.ts) {
    const st = { lat0: fix.lat, lng0: fix.lng, ts: fix.ts, skips: 0, lastGate: 0 };
    // The first fix knows nothing about velocity (phone headings are not trusted: they can be stale or wrong at low speed).
    st.x = axis(0, 0, r);
    st.y = axis(0, 0, r);
    st.out = [fix.lat, fix.lng];
    return { state: st, lat: fix.lat, lng: fix.lng, skipped: false, held: false };
  }

  const st = state;
  const dt = (fix.ts - st.ts) / 1000;
  // A stopped bus is not about to swerve. After fixes that keep missing the prediction (a turn, braking hard), the filter
  // is allowed to change course faster for a moment.
  const surprised = st.lastGate > cfg.turnGateSigma ? cfg.turnBoost : 1;
  const q = (moving ? surprised : cfg.stoppedAccelFactor) * cfg.accelSigma ** 2;
  predict(st.x, dt, q);
  predict(st.y, dt, q);
  st.ts = fix.ts;

  const [zx, zy] = toXY(st, fix.lat, fix.lng);
  const gate = Math.hypot((zx - st.x.pos) / Math.sqrt(st.x.p00 + r), (zy - st.y.pos) / Math.sqrt(st.y.p00 + r));
  st.lastGate = gate;
  let skipped = false;
  if (gate > cfg.gateSigma && st.skips < cfg.maxSkips) {
    skipped = true; // keep the prediction
    st.skips += 1;
  } else {
    st.skips = 0;
    update(st.x, zx, r);
    update(st.y, zy, r);
  }

  // A bus that says it is stopped is stopped: no drift along the track, and the stop is held where it is.
  let held = false;
  if (!moving) {
    st.x.vel = 0;
    st.y.vel = 0;
    st.x.p11 = Math.min(st.x.p11, 1);
    st.y.p11 = Math.min(st.y.p11, 1);
    held = true;
  }

  const [lat, lng] = toLatLng(st, st.x.pos, st.y.pos);
  st.out = [lat, lng];
  return { state: st, lat, lng, skipped, held };
}

module.exports = { smoothFix, SMOOTHING };
