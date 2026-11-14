// The decisions telemetry makes, as pure functions: no socket, no GPS, no storage, so they can be tested with plain Node.
// telemetry.js is the thin shell that feeds them real positions and acknowledgements.
import { CLIENT_BATCH, CLIENT_SPEED_CAP_MPS, MAX_QUEUE } from '../shared/contract';

// Every wait the telemetry shell uses. The position interval itself is FIX_INTERVAL_MS in the contract.
export const TIMING = {
  FIX_ACK_MS: 5000, // a live position not acknowledged within this is queued as if it never arrived
  BATCH_ACK_MS: 10000, // a saved batch not acknowledged within this is sent again later
  RETRY_MS: 5000, // while anything is queued, try to send it this often (even if the bus is parked)
  RECONNECT_MAX_MS: 5000, // longest wait between two reconnect attempts
};

const METRES_PER_DEGREE = 111320;

// Metres between two { lat, lng } points (equirectangular; fine over a few seconds of travel).
export function metresBetween(a, b) {
  return Math.hypot((b.lat - a.lat) * METRES_PER_DEGREE, (b.lng - a.lng) * METRES_PER_DEGREE * Math.cos((a.lat * Math.PI) / 180));
}

// Speed in m/s. The device's own reading wins; some devices and browsers report none (null or negative), and then it is
// the distance from the previous fix over the time between them (0 without an earlier fix). Never above the client cap.
export function deriveSpeed(reported, prev, point, ts) {
  let speed = reported != null && reported >= 0 ? reported : null;
  if (speed == null) speed = prev && ts > prev.ts ? metresBetween(prev, point) / ((ts - prev.ts) / 1000) : 0;
  return Math.min(speed, CLIENT_SPEED_CAP_MPS);
}

// One position as the server expects it, from a Location reading (coords + timestamp) and the previous fix.
export function buildFix(coords, timestamp, prev, now = Date.now()) {
  const ts = Math.round(timestamp || now);
  const point = { lat: coords.latitude, lng: coords.longitude };
  return {
    ...point,
    speed: deriveSpeed(coords.speed, prev, point, ts), // m/s
    heading: coords.heading != null && coords.heading >= 0 ? coords.heading : null,
    accuracy: coords.accuracy ?? null,
    ts,
  };
}

// The queue with one more fix, the oldest dropped once it holds more than `max` (2000 is about 100 minutes offline;
// raise the cap or move to SQLite if pilots show longer dead zones).
export function enqueueFix(queue, fix, max = MAX_QUEUE) {
  const next = [...queue, fix];
  return next.length > max ? next.slice(next.length - max) : next;
}

// The next batch to send, oldest first.
export function takeBatch(queue, size = CLIENT_BATCH) {
  return queue.slice(0, size);
}

// The queue once the server acknowledged the first `count` fixes. Fixes queued while the batch was in flight stay.
export function removeAcked(queue, count) {
  return queue.slice(count);
}
