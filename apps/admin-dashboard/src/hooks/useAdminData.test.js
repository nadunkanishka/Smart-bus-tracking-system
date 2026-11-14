import { renderHook, waitFor } from '@testing-library/react';
import { useAdminData } from './useAdminData';
import { mockFetch, signedInAs } from '../test/fetchMock';

test('routes arrive with GeoJSON [lng, lat] turned into [lat, lng], buses with raw numbers', async () => {
  signedInAs({ username: 'admin', token: 't' });
  mockFetch({
    '/drivers': { status: 200, body: [] },
    '/buses': { status: 200, body: [{ _id: 'b1', busId: 'BUS-001', registration: 'NB-1', capacity: 52, mileage: 1200 }] },
    '/routes': {
      status: 200,
      body: [{
        _id: 'r1', routeId: 'RT-001', name: 'Pettah to Homagama', start: 'Pettah', end: 'Homagama', distance: 24.5,
        stops: ['Pettah', 'Homagama'],
        stopPoints: [
          { name: 'Pettah', location: { type: 'Point', coordinates: [79.85, 6.93] } },
          { name: 'Homagama', location: { type: 'Point', coordinates: [80.0, 6.84] } },
        ],
        path: { type: 'LineString', coordinates: [[79.85, 6.93], [79.9, 6.9], [80.0, 6.84]] },
      }],
    },
    '/dashboard/summary': { status: 200, body: { activeRoutes: 1, registeredBuses: 1, activeDrivers: 0, fleetDistribution: { active: 1, idle: 0, maintenance: 0 } } },
  });

  const { result } = renderHook(() => useAdminData());
  await waitFor(() => expect(result.current.loading).toBe(false));

  const [route] = result.current.routes;
  expect(route.id).toBe('RT-001');
  expect(route.stopPoints).toEqual([{ name: 'Pettah', lat: 6.93, lng: 79.85 }, { name: 'Homagama', lat: 6.84, lng: 80.0 }]);
  expect(route.path).toEqual([[6.93, 79.85], [6.9, 79.9], [6.84, 80.0]]);
  expect(route.distance).toBe(24.5);
  expect(result.current.buses[0]).toMatchObject({ id: 'BUS-001', capacity: 52, mileage: 1200 });
  expect(result.current.backendConnected).toBe(true);
});

test('an unreachable server leaves the console disconnected and not loading', async () => {
  signedInAs({ username: 'admin', token: 't' });
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  const { result } = renderHook(() => useAdminData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.backendConnected).toBe(false);
});
