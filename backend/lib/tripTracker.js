// Per-bus trip state machine (pure). Turns the stream of ETA results into the records the proposal needs:
//   - segment logs (traversal + dwell time per segment) that become the ETA engine's historical baseline
//   - ETA logs (predicted vs actual arrival per stop) for the mean-absolute-error evaluation metric
const { baselineEtaSec } = require('./eta');
const { STOP_RADIUS_M, DWELL_GAP_MS, START_RADIUS_M, MIN_MOVING_MPS } = require('./limits');

// What was predicted for every upcoming stop at this moment: the engine's answer and, beside it, the plain baseline's.
const snapshot = (route, eta, fix) => eta.stops
  .filter((s) => s.status === 'upcoming')
  .map((s) => {
    const base = baselineEtaSec(route, fix, s.index);
    return { stopIndex: s.index, predictedAt: fix.ts, predictedArrival: fix.ts + s.etaSec * 1000, baselineArrival: base == null ? null : Math.round(fix.ts + base * 1000) };
  });

function startTrip(route, eta, fix, tripId) {
  return {
    tripId,
    segIndex: eta.segIndex,
    segEnteredTs: fix.ts,
    dwellMs: 0,
    lastTs: fix.ts,
    // joined mid-segment: its traversal time is not a full sample
    partial: eta.distAlong - route.stopDist[eta.segIndex] > START_RADIUS_M,
    predictions: snapshot(route, eta, fix),
  };
}

// Returns { state, segmentLogs, etaLogs, ended }.
function advance(state, route, eta, fix) {
  const out = { state, segmentLogs: [], etaLogs: [], ended: false };
  const dt = fix.ts - state.lastTs;
  state.lastTs = fix.ts;

  const nearStop = route.stopDist.some((d) => Math.abs(d - eta.distAlong) <= STOP_RADIUS_M);
  if (nearStop && fix.speed < MIN_MOVING_MPS && dt > 0 && dt <= DWELL_GAP_MS) state.dwellMs += dt;

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
        baselineArrival: p.baselineArrival,
        baselineErrorSec: p.baselineArrival == null ? null : Math.round((p.baselineArrival - fix.ts) / 1000),
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
  state.predictions = state.predictions.filter((p) => p.stopIndex > reached).concat(snapshot(route, eta, fix));
  out.ended = eta.finished;
  return out;
}

module.exports = { startTrip, advance };
