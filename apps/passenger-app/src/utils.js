

// Which bus matters to this passenger: the next one still coming to the boarding stop; otherwise one that has
// passed it and is heading to the destination; otherwise any live bus on the route.
export function pickBus(all, boardingIndex, destinationIndex) {
  const fresh = all.filter((b) => !b.stale);
  const list = fresh.length ? fresh : all; // a bus that lost signal is only tracked when nothing else is live
  const eta = (bus, i) => (bus.stops?.[i]?.status === 'upcoming' ? bus.stops[i].etaSec : null);
  const nearest = (i) => list.filter((b) => eta(b, i) != null).sort((a, b) => eta(a, i) - eta(b, i))[0];
  const coming = nearest(boardingIndex);
  if (coming) return { bus: coming, phase: 'coming', etaMin: coming.stops[boardingIndex].etaMin };
  const riding = nearest(destinationIndex);
  if (riding) return { bus: riding, phase: 'passed', etaMin: riding.stops[destinationIndex].etaMin };
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
