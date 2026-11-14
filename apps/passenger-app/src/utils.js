

// Which bus matters to this passenger: the next one still coming to the boarding stop; otherwise one that has
// passed it and is heading to the destination; otherwise any live bus on the route.
export function pickBus(all, boardingIndex, destinationIndex, boardingStop, destinationStop) {
  const fresh = all.filter((b) => !b.stale);
  const list = fresh.length ? fresh : all; // a bus that lost signal is only tracked when nothing else is live
  // The stop is found by name in the bus's own update; the index is only the fallback. The passenger's copy of the route can
  // be older than the bus's (a stop added or removed in the admin since the app loaded), and then the indices disagree.
  const at = (bus, name, fallback) => { const k = name ? (bus.stops || []).findIndex((s) => s.name === name) : -1; return k >= 0 ? k : fallback; };
  const eta = (bus, name, i) => { const stop = bus.stops?.[at(bus, name, i)]; return stop?.status === 'upcoming' ? stop.etaSec : null; };
  const nearest = (name, i) => list.filter((b) => eta(b, name, i) != null).sort((a, b) => eta(a, name, i) - eta(b, name, i))[0];
  const coming = nearest(boardingStop, boardingIndex);
  if (coming) return { bus: coming, phase: 'coming', etaMin: coming.stops[at(coming, boardingStop, boardingIndex)].etaMin };
  const riding = nearest(destinationStop, destinationIndex);
  if (riding) return { bus: riding, phase: 'passed', etaMin: riding.stops[at(riding, destinationStop, destinationIndex)].etaMin };
  return list[0] ? { bus: list[0], phase: 'done', etaMin: null } : null;
}

// What the tracked bus means for this passenger, in one line.
export function trackedSummary(tracked, boardingStop, destinationStop) {
  if (!tracked) return '';
  if (tracked.bus.stale) return 'Signal lost. Showing the last known position.';
  if (tracked.phase === 'coming') return `Arrives at ${boardingStop} in ${tracked.etaMin} min`;
  if (tracked.phase === 'passed') return `Passed ${boardingStop}. ${tracked.etaMin} min to ${destinationStop}`;
  return 'This bus has passed your stops.';
}
