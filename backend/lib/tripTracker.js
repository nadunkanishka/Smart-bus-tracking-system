// Per-bus trip state machine (pure). Turns the stream of ETA results into the records the proposal needs:
//   - segment logs (traversal + dwell time per segment) that become the ETA engine's historical baseline
//   - ETA logs (predicted vs actual arrival per stop) for the mean-absolute-error evaluation metric
const { DEFAULTS } = require('./eta');

const STOP_RADIUS_M = 40; // slow time this close to a stop counts as dwell
const MAX_GAP_MS = 30000; // gaps longer than this (offline, off duty) are not counted as dwell

const snapshot = (eta, ts) => eta.stops
  .filter((s) => s.status === 'upcoming')
  .map((s) => ({ stopIndex: s.index, predictedAt: ts, predictedArrival: ts + s.etaSec * 1000 }));

function startTrip(eta, fix, tripId) {
  return {
    tripId,
    segIndex: eta.segIndex,
    segEnteredTs: fix.ts,
    dwellMs: 0,
    lastTs: fix.ts,
    partial: eta.distAlong > STOP_RADIUS_M, // joined mid-segment: its traversal time is not a full sample
    predictions: snapshot(eta, fix.ts),
  };
}

// Returns { state, segmentLogs, etaLogs, ended }.
function advance(state, route, eta, fix) {
  const out = { state, segmentLogs: [], etaLogs: [], ended: false };
  const dt = fix.ts - state.lastTs;
  state.lastTs = fix.ts;

  const nearStop = route.stopDist.some((d) => Math.abs(d - eta.distAlong) <= STOP_RADIUS_M);
  if (nearStop && fix.speed < DEFAULTS.minMovingMps && dt > 0 && dt <= MAX_GAP_MS) state.dwellMs += dt;

  const reached = eta.finished ? route.stops.length - 1 : eta.segIndex; // index of the last stop reached
  if (reached <= state.segIndex) return out; // still in the same segment (or GPS jitter backwards)

  // Arrivals at every stop passed since the last fix: compare with what was predicted earlier.
  for (let stop = state.segIndex + 1; stop <= reached; stop += 1) {
    state.predictions.filter((p) => p.stopIndex === stop).forEach((p) => {
      out.etaLogs.push({
        stopIndex: stop,
        predictedAt: p.predictedAt,
        predictedArrival: p.predictedArrival,
        actualArrival: fix.ts,
        horizonSec: Math.round((p.predictedArrival - p.predictedAt) / 1000),
        errorSec: Math.round((p.predictedArrival - fix.ts) / 1000),
      });
    });
  }

  // A clean single-segment crossing is one historical sample for that segment.
  if (!state.partial && reached === state.segIndex + 1) {
    const totalSec = (fix.ts - state.segEnteredTs) / 1000;
    const dwellSec = Math.min(state.dwellMs / 1000, totalSec);
    out.segmentLogs.push({ segIndex: state.segIndex, traversalSec: Math.round(totalSec - dwellSec), dwellSec: Math.round(dwellSec) });
  }

  state.segIndex = reached;
  state.segEnteredTs = fix.ts;
  state.dwellMs = 0;
  state.partial = false;
  state.predictions = state.predictions.filter((p) => p.stopIndex > reached).concat(snapshot(eta, fix.ts));
  out.ended = eta.finished;
  return out;
}

module.exports = { startTrip, advance, STOP_RADIUS_M };
