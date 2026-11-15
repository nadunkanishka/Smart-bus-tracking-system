import { fleetOf, fleetSegments, ringBackground, stopBars } from './dashboardData';

test('a missing fleet group counts as zero and the total adds the three', () => {
  expect(fleetOf({})).toEqual({ active: 0, idle: 0, maintenance: 0, total: 0 });
  expect(fleetOf({ fleetDistribution: { active: 5, idle: 2 } })).toEqual({ active: 5, idle: 2, maintenance: 0, total: 7 });
});

test('an empty fleet draws a plain grey ring', () => {
  expect(ringBackground(fleetSegments(fleetOf({})), 0, 1)).toBe('conic-gradient(var(--a-line) 0 100%)');
});

test('the finished ring splits 100% by share and leaves out empty groups', () => {
  const fleet = fleetOf({ fleetDistribution: { active: 3, idle: 1, maintenance: 0 } });
  const ring = ringBackground(fleetSegments(fleet), fleet.total, 1);
  expect(ring).toBe('conic-gradient(var(--green) 0% 75%, var(--violet) 75% 100%)');
});

test('while the ring sweeps, the rest is the track colour', () => {
  const fleet = fleetOf({ fleetDistribution: { active: 1, idle: 1, maintenance: 0 } });
  expect(ringBackground(fleetSegments(fleet), fleet.total, 0.5)).toBe('conic-gradient(var(--green) 0% 25%, var(--violet) 25% 50%, var(--a-line) 50% 100%)');
});

test('stop bars take the first routes, label them by number and mark the tallest', () => {
  const route = (id, n, stops) => ({ id, routeNumber: n, name: `Route ${id}`, distance: 10, stopPoints: new Array(stops).fill({}) });
  const { bars, tallest, top } = stopBars([route('RT-1', '138', 4), route('RT-2', '', 9), route('RT-3', '100', 2)], 2);
  expect(bars.map((b) => b.label)).toEqual(['138', 'RT-2']);
  expect([tallest, top]).toEqual([9, 1]);
});

test('no routes gives no bars and a tallest of one, so the chart never divides by zero', () => {
  expect(stopBars([], 7)).toEqual({ bars: [], tallest: 1, top: -1 });
});
