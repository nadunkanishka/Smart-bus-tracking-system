// Backend-only thresholds. The values the clients share (fix interval, live window, cache lifetime, speed cap,
// batch size) are in ./contract.js; this file holds the ones only the server uses, and says how they relate.
//
// Time, shortest first:
//   MIN_FIX_GAP_MS (0.9 s) < FIX_INTERVAL_MS (3 s, contract): a phone sending faster than about once a second is dropped
//   LIVE_WINDOW_MS (15 s, contract): older fixes are history, not a live position
//   < SMOOTHER_RESET_MS = DWELL_GAP_MS (30 s): after a gap this long the bus is "somewhere new": the smoother starts
//     again and the gap is not counted as dwell at a stop (both mean "signal lost or off duty", so they are equal)
//   < GONE_AFTER_MS (60 s, contract): the latest-fix cache drops the bus
//   < ROUTE_CACHE_MS (5 min): a route's geometry and history baseline are re-read this often
//   < FORGET_BUS_MS (15 min): a disconnected bus leaves the admin's live list
//   < MAX_FIX_AGE_MS (24 h): a buffered fix older than this is refused
//
// Distance along the route, smallest first:
//   STOP_RADIUS_M (40 m) = ARRIVE_RADIUS_M (40 m): "at a stop" for dwell time, and "arrived" at the final stop
//   < START_RADIUS_M (150 m): a trip that starts this close after the first stop counts as starting there
//   < BACK_AT_START_M (200 m): a bus this close to the start, behind its trip's segment, has begun a new trip
//
// Speed:
//   DEFAULT_SPEED_MPS: what the ETA engine assumes for a segment with no history yet
//   BASELINE_SPEED_MPS: the plain comparison estimate (straight line / this speed), used only for the evaluation.
//   They are equal today (about 20 km/h) but mean different things, so they can change independently.
//   JUMP_FACTOR: two fixes further apart than MAX_SPEED_MPS (contract) * JUMP_FACTOR allows are a position jump;
//   the margin covers GPS error on two fixes a few seconds apart.

const MIN_FIX_GAP_MS = 900;
const SMOOTHER_RESET_MS = 30 * 1000;
const DWELL_GAP_MS = 30 * 1000;
const ROUTE_CACHE_MS = 5 * 60 * 1000;
const FORGET_BUS_MS = 15 * 60 * 1000;
const MAX_FIX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_MS = 60 * 1000; // tolerate one minute of device clock drift
const GPS_FLUSH_MS = 5000; // accepted fixes are written to GpsLog in batches this often

const STOP_RADIUS_M = 40;
const ARRIVE_RADIUS_M = 40;
const START_RADIUS_M = 150;
const BACK_AT_START_M = 200;

const DEFAULT_SPEED_MPS = 5.5;
const BASELINE_SPEED_MPS = 5.5;
const MIN_MOVING_MPS = 1.5; // below this the bus is treated as stopped or crawling
const JUMP_FACTOR = 1.5;

module.exports = {
  MIN_FIX_GAP_MS, SMOOTHER_RESET_MS, DWELL_GAP_MS, ROUTE_CACHE_MS, FORGET_BUS_MS, MAX_FIX_AGE_MS, MAX_FUTURE_MS, GPS_FLUSH_MS,
  STOP_RADIUS_M, ARRIVE_RADIUS_M, START_RADIUS_M, BACK_AT_START_M,
  DEFAULT_SPEED_MPS, BASELINE_SPEED_MPS, MIN_MOVING_MPS, JUMP_FACTOR,
};
