// GPS fix payload validation. Returns { ok, fix } or { ok: false, error }.
// Payload: { lat, lng, speed (m/s), heading (deg), accuracy (m), ts (device epoch ms), seq }

const MAX_FUTURE_MS = 60 * 1000; // tolerate one minute of device clock drift
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // buffered fixes older than a day are discarded
const MAX_SPEED_MPS = 45; // 162 km/h, well above any bus

function validateFix(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Fix must be an object' };
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  const ts = Number(raw.ts);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { ok: false, error: 'lat out of range' };
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return { ok: false, error: 'lng out of range' };
  if (!Number.isFinite(ts) || ts <= 0) return { ok: false, error: 'ts (device epoch ms) is required' };
  if (ts > now + MAX_FUTURE_MS) return { ok: false, error: 'ts is in the future' };
  if (ts < now - MAX_AGE_MS) return { ok: false, error: 'ts is too old' };

  let speed = Number(raw.speed);
  if (!Number.isFinite(speed) || speed < 0) speed = 0; // devices report -1 when speed is unknown
  if (speed > MAX_SPEED_MPS) return { ok: false, error: 'speed out of range' };
  let heading = Number(raw.heading);
  if (!Number.isFinite(heading) || heading < 0 || heading > 360) heading = null;
  const accuracy = Number.isFinite(Number(raw.accuracy)) ? Number(raw.accuracy) : null;
  const seq = Number.isFinite(Number(raw.seq)) ? Number(raw.seq) : null;

  return { ok: true, fix: { lat, lng, speed, heading, accuracy, ts, seq } };
}

module.exports = { validateFix, MAX_SPEED_MPS };
