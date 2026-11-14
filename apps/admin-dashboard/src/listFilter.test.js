import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ALL, filterRecords, statusCounts } from './listFilter';
import RouteForm from './components/RouteForm';
import App from './App';
import { mockFetch, signedInAs } from './test/fetchMock';

const BUSES = [
  { id: 'BUS-001', registration: 'NA-9001', status: 'Active', assignedDriver: 'DRV-001' },
  { id: 'BUS-002', registration: 'NB-9002', status: 'Maintenance', assignedDriver: 'DRV-002' },
  { id: 'BUS-003', registration: 'NC-9003', status: 'Idle', assignedDriver: '' },
];
const KEYS = ['id', 'registration', 'assignedDriver'];

describe('filterRecords', () => {
  test('no filter returns everything', () => {
    expect(filterRecords(BUSES, {}, KEYS)).toHaveLength(3);
  });
  test('a status keeps only that status; ALL keeps every status', () => {
    expect(filterRecords(BUSES, { status: 'Idle' }, KEYS).map((b) => b.id)).toEqual(['BUS-003']);
    expect(filterRecords(BUSES, { status: ALL }, KEYS)).toHaveLength(3);
  });
  test('search ignores case and matches every word in any field', () => {
    expect(filterRecords(BUSES, { text: 'nb-9002' }, KEYS).map((b) => b.id)).toEqual(['BUS-002']);
    expect(filterRecords(BUSES, { text: 'drv-001 na' }, KEYS).map((b) => b.id)).toEqual(['BUS-001']);
    expect(filterRecords(BUSES, { text: 'zzz' }, KEYS)).toEqual([]);
  });
  test('search, status and the extra test all have to match', () => {
    expect(filterRecords(BUSES, { text: 'bus', status: 'Active', extra: (b) => b.assignedDriver }, KEYS).map((b) => b.id)).toEqual(['BUS-001']);
  });
  test('array fields (a route\'s stops) are searched too', () => {
    const routes = [{ id: 'RT-1', status: 'Active', stops: ['Pettah', 'Homagama'] }];
    expect(filterRecords(routes, { text: 'homa' }, ['stops'])).toHaveLength(1);
  });
});

test('statusCounts counts each status and the total', () => {
  expect(statusCounts(BUSES, ['Active', 'Idle', 'Maintenance'])).toEqual({ All: 3, Active: 1, Idle: 1, Maintenance: 1 });
});

test('the route form offers only free buses, plus the ones already on this route', () => {
  const buses = [
    { id: 'BUS-001', registration: 'NA-9001', capacity: 50, routeId: '' },
    { id: 'BUS-002', registration: 'NB-9002', capacity: 50, routeId: 'RT-001' },
    { id: 'BUS-003', registration: 'NC-9003', capacity: 50, routeId: 'RT-002' },
  ];
  const updateField = jest.fn();
  render(<RouteForm formData={{ name: '', routeNumber: '', start: '', end: '', distance: '', busIds: ['BUS-002'] }} updateField={updateField} setFormData={() => {}} buses={buses} />);
  const list = screen.getByRole('group', { name: 'Buses on this route' });
  expect(within(list).getAllByRole('checkbox')).toHaveLength(2); // BUS-001 is free, BUS-002 is on this route; BUS-003 is taken
  expect(within(list).queryByText(/NC-9003/)).toBeNull();
  fireEvent.click(within(list).getByLabelText(/NA-9001/));
  expect(updateField).toHaveBeenCalledWith('busIds', ['BUS-002', 'BUS-001']);
});

test('the Buses page filters by status pill and by search, and says when nothing matches', async () => {
  signedInAs({ id: 'a1', username: 'admin', token: 't' });
  const bus = (b) => ({ ...b, busId: b.id, _id: b.id, capacity: 50, mileage: 1, hasPassword: true });
  mockFetch({
    '/drivers': { status: 200, body: [] },
    '/routes': { status: 200, body: [] },
    '/buses': { status: 200, body: BUSES.map(bus) },
    '/dashboard/summary': { status: 200, body: { activeRoutes: 0, registeredBuses: 3, activeDrivers: 0, fleetDistribution: { active: 1, idle: 1, maintenance: 1 } } },
  });
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: /^Buses$/ }));
  const table = await screen.findByRole('table');
  await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(4)); // header + 3

  fireEvent.click(screen.getByRole('button', { name: /^Maintenance/ }));
  expect(within(table).getAllByRole('row')).toHaveLength(2);
  expect(within(table).getByText('NB-9002')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^All/ }));
  fireEvent.change(screen.getByLabelText(/search buses/i), { target: { value: 'nc-9' } });
  expect(within(table).getAllByRole('row')).toHaveLength(2);

  fireEvent.change(screen.getByLabelText(/search buses/i), { target: { value: 'nothing' } });
  expect(screen.getByText(/No matches/)).toBeInTheDocument();
});
