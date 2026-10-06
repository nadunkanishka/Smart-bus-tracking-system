// Segmented-route ETA prediction engine (pure functions, no I/O).
//
// A route is pre-segmented at its stops: segment i runs from stop i to stop i+1 along the road polyline.
// For every live GPS fix:
//   (a) project the bus onto the nearest point of the route polyline
//   (b) find the active segment and the distance left in it
//   (c) time to finish the current segment from instantaneous speed
//   (d) add historical average traversal + dwell time for every later segment
const { cumulativeDistances, projectOntoLine } = require('./geo');

const DEFAULTS = {
  speedMps: 5.5, // ~20 km/h urban bus average, used when a segment has no history yet
  dwellSec: 20, // default dwell per intermediate stop without history
  minMovingMps: 1.5, // below this the bus is treated as stopped/crawling
};

// line: [[lat,lng]...], stops: [{ name, lat, lng }], history: { [segIndex]: { traversalSec, dwellSec, samples } }
function prepareRoute(line, stops, history = {}) {
  if (!Array.isArray(line) || line.length < 2) throw new Error('Route polyline needs at least 2 points');
  if (!Array.isArray(stops) || stops.length < 2) throw new Error('Route needs at least 2 stops');
  const cum = cumulativeDistances(line);
  const stopDist = [];
  stops.forEach((s, i) => {
    // Stops are projected in order: each stop must lie at or after the previous one along the line.
    const p = projectOntoLine(line, cum, [s.lat, s.lng]);
    stopDist.push(Math.max(p.distAlong, i ? stopDist[i - 1] : 0));
  });
  const segments = [];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const length = stopDist[i + 1] - stopDist[i];
    const h = history[i];
    const hasHistory = !!(h && h.samples > 0 && h.traversalSec > 0);
    segments.push({
      index: i,
      from: stops[i].name,
      to: stops[i + 1].name,
      length,
      traversalSec: hasHistory ? h.traversalSec : length / DEFAULTS.speedMps,
      dwellSec: hasHistory ? h.dwellSec : DEFAULTS.dwellSec, // dwell at the segment's end stop
      samples: hasHistory ? h.samples : 0,
    });
  }
  return { line, cum, stops, stopDist, segments, length: cum[cum.length - 1] };
}

// fix: { lat, lng, speed (m/s) }, near: last known distAlong for this bus (optional)
function computeEta(route, fix, near) {
  const proj = projectOntoLine(route.line, route.cum, [fix.lat, fix.lng], near); // (a)
  const d = proj.distAlong;
  const last = route.stops.length - 1;

  // (b) active segment: the last stop already reached decides it
  let seg = 0;
  while (seg < last - 1 && d >= route.stopDist[seg + 1]) seg += 1;
  const atEnd = d >= route.stopDist[last] - 1;
  const remaining = Math.max(0, route.stopDist[seg + 1] - d);

  // (c) current segment from instantaneous speed; when stopped or crawling, use the segment's usual speed
  const s = route.segments[seg];
  const usual = s.length > 0 ? s.length / s.traversalSec : DEFAULTS.speedMps;
  const speed = fix.speed >= DEFAULTS.minMovingMps ? fix.speed : usual;
  const currentSec = remaining / speed;

  // (d) later segments from history, plus dwell at each stop passed through on the way
  let acc = currentSec;
  const stops = route.stops.map((stop, i) => {
    if (atEnd || i <= seg) return { index: i, name: stop.name, status: 'passed', etaSec: null, etaMin: null };
    if (i > seg + 1) acc += route.segments[i - 2].dwellSec + route.segments[i - 1].traversalSec;
    return { index: i, name: stop.name, status: 'upcoming', etaSec: Math.round(acc), etaMin: Math.max(1, Math.round(acc / 60)) };
  });

  return {
    distAlong: d,
    offRoute: proj.offRoute,
    snapped: proj.point,
    segIndex: seg,
    remainingInSegment: remaining,
    finished: atEnd,
    stops,
  };
}

module.exports = { prepareRoute, computeEta, DEFAULTS };
