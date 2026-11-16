

import { GONE_AFTER_MS, LIVE_WINDOW_MS } from './shared/contract';

// Which bus matters to this passenger: the next one still coming to the boarding stop; otherwise one that has
// passed it and is heading to the destination; otherwise any live bus on the route.
// A trip from a later stop to an earlier one runs the other way ('back'). Only buses on that leg count: a bus that
// started from the other terminal is not shown (it joins the other trip once it turns round at the end).
export function pickBus(all, boardingIndex, destinationIndex, boardingStop, destinationStop) {
  const dir = destinationIndex >= boardingIndex ? 'out' : 'back';
  const onLeg = all.filter((b) => (b.direction || 'out') === dir);
  const fresh = onLeg.filter((b) => !b.stale);
  // a bus that lost signal is only tracked when nothing else is live
  const list = fresh.length ? fresh : onLeg;
  // The stop is found by name in the bus's own update; the index is only the fallback. The passenger's copy of the route can
  // be older than the bus's (a stop added or removed in the admin since the app loaded), and then the indices disagree.
  const at = (bus, name, fallback) => { const k = name ? (bus.stops || []).findIndex((s) => s.name === name) : -1; return k >= 0 ? k : dir === 'back' ? (bus.stops || []).length - 1 - fallback : fallback; };
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

// The saved journey, if its route is still listed: the route and the two stops. A stop that no longer exists, or a trip that
// would start and end at the same stop, falls back to the route's terminals.
export function restoreJourney(routes, saved) {
  const route = routes.find((r) => r.id === saved?.routeId);
  if (!route) return null;
  const { stops } = route;
  const b = stops.indexOf(saved.boarding);
  const d = stops.indexOf(saved.destination);
  const keep = b >= 0 && d >= 0 && d !== b;
  return { route, boarding: keep ? saved.boarding : stops[0] || null, destination: keep ? saved.destination : stops[stops.length - 1] || null };
}

// The buses on the passenger's route that are still worth showing: a bus not heard from for GONE_AFTER_MS is dropped, one not heard
// from for LIVE_WINDOW_MS is shown as "signal lost" (stale). `buses` maps busId to the last update plus recvAt (when it arrived).
export function visibleBuses(buses, routeId, now) {
  return Object.values(buses)
    .filter((b) => b.routeId === routeId && now - b.recvAt < GONE_AFTER_MS)
    .map((b) => ({ ...b, stale: now - b.recvAt > LIVE_WINDOW_MS }));
}

// The first message after subscribing: the latest cached fix of every bus on the route. A cached fix may already be a while old,
// so each keeps its real age (serverTs - serverEmitTs) and a stale bus is flagged straight away.
export function busesFromSnapshot(list, serverTs, now) {
  return Object.fromEntries(list.map((b) => [b.busId, { ...b, recvAt: now - Math.max(0, serverTs - b.serverEmitTs) }]));
}

// The route list for the search box: a route matches on its number, its name or any stop; the route being tracked comes first.
export function searchRoutes(routes, query, selectedId) {
  const q = query.trim().toLowerCase();
  const found = q ? routes.filter((r) => String(r.number).toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.stops.some((s) => s.toLowerCase().includes(q))) : routes;
  return [...found.filter((r) => r.id === selectedId), ...found.filter((r) => r.id !== selectedId)];
}
