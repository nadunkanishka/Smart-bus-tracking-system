// The numbers behind the dashboard cards, kept out of the page so they can be tested on their own.

// Fleet counts from the dashboard summary; a missing group counts as zero.
export function fleetOf(summary) {
  const fleet = { active: 0, idle: 0, maintenance: 0, ...summary.fleetDistribution };
  return { ...fleet, total: fleet.active + fleet.idle + fleet.maintenance };
}

// The fleet split as ring segments: green running, violet idle, red in service.
export const fleetSegments = (fleet) => [
  { key: 'active', label: 'Running', color: 'var(--green)', n: fleet.active },
  { key: 'idle', label: 'Idle', color: 'var(--violet)', n: fleet.idle },
  { key: 'maintenance', label: 'Service', color: 'var(--danger)', n: fleet.maintenance },
];

// A conic-gradient for the fleet ring drawn up to progress p (0 to 1; the motion hook sweeps it round once). p = 1 is the finished ring.
export function ringBackground(segments, total, p) {
  if (!total) return 'conic-gradient(var(--a-line) 0 100%)';
  let at = 0;
  const parts = segments.filter((s) => s.n > 0).map((s) => {
    const from = at * p;
    at += (s.n / total) * 100;
    return `${s.color} ${from}% ${at * p}%`;
  });
  return `conic-gradient(${parts.join(', ')}${p < 1 ? `, var(--a-line) ${p * 100}% 100%` : ''})`;
}

// Stops per route as bars (the first `max` routes). `top` is the index of the tallest bar, the one that gets the detail card.
export function stopBars(routes, max) {
  const bars = routes.slice(0, max).map((r) => ({ id: r.id, label: r.routeNumber || r.id, name: r.name, stops: r.stopPoints.length, distance: r.distance }));
  const tallest = Math.max(1, ...bars.map((b) => b.stops));
  return { bars, tallest, top: bars.findIndex((b) => b.stops === tallest) };
}
