import { ENTITIES, missingFields } from './entities';

// Per entity: a blank add form must name exactly these fields, and a filled form must produce exactly this payload.
const CASES = [
  {
    entity: 'driver',
    missing: ['full name', 'license number', 'license expiry', 'phone number'],
    form: { name: ' A. Bandara ', license: ' LK-2024-1 ', expiry: '2027-01-31', phone: ' +94 71 000 0000 ', status: 'On Leave' },
    payload: { name: 'A. Bandara', license: 'LK-2024-1', expiry: '2027-01-31', phone: '+94 71 000 0000', status: 'On Leave' },
  },
  {
    entity: 'bus',
    missing: ['registration number', 'seating capacity', 'mileage', 'bus password'],
    form: { registration: ' NB-4712 ', capacity: '52', mileage: '1200', password: 'pw-1', assignedDriver: 'DRV-001', status: 'Idle' },
    payload: { registration: 'NB-4712', capacity: 52, mileage: 1200, password: 'pw-1', assignedDriver: 'DRV-001', status: 'Idle' },
  },
  {
    entity: 'route',
    missing: ['route name', 'start terminal', 'end terminal', 'distance'],
    form: {
      name: ' Pettah to Homagama ', routeNumber: ' 138 ', start: ' Pettah ', end: ' Homagama ', distance: '24.5',
      stopPoints: [{ name: ' Pettah ', lat: 6.93, lng: 79.85 }, { name: 'Homagama', lat: 6.84, lng: 80.0 }],
      path: [[6.93, 79.85], [6.84, 80.0]], assignedBus: 'NB-4712 (BUS-002)', status: 'Active',
    },
    payload: {
      name: 'Pettah to Homagama', routeNumber: '138', start: 'Pettah', end: 'Homagama', distance: 24.5,
      stopPoints: [{ name: 'Pettah', lat: 6.93, lng: 79.85 }, { name: 'Homagama', lat: 6.84, lng: 80.0 }],
      stops: ['Pettah', 'Homagama'], path: [[6.93, 79.85], [6.84, 80.0]], assignedBus: 'NB-4712 (BUS-002)', status: 'Active',
    },
  },
];

describe.each(CASES)('$entity', ({ entity, missing, form, payload }) => {
  test('a blank add form lists every required field', () => {
    expect(missingFields(entity, ENTITIES[entity].blank, 'add')).toEqual(missing);
  });

  test('a filled form has nothing missing', () => {
    expect(missingFields(entity, form, 'add')).toEqual([]);
  });

  test('the payload is trimmed and typed', () => {
    expect(ENTITIES[entity].toPayload(form)).toEqual(payload);
  });
});

test('editing a bus does not require a new password', () => {
  const form = { registration: 'NB-4712', capacity: 52, mileage: 0, password: '', assignedDriver: '', status: 'Active' };
  expect(missingFields('bus', form, 'edit')).toEqual([]);
  expect(missingFields('bus', form, 'add')).toEqual(['bus password']);
});

test('a route stop without a name is reported', () => {
  const form = { name: 'R', start: 'A', end: 'B', distance: 3, stopPoints: [{ name: 'A', lat: 1, lng: 1 }, { name: '  ', lat: 2, lng: 2 }] };
  expect(missingFields('route', form, 'add')).toEqual(['a name for every stop']);
});

test('a bus survives API record -> form -> payload with its numbers intact', () => {
  const bus = ENTITIES.bus;
  const record = bus.fromApi({ _id: 'm1', busId: 'BUS-002', registration: 'NB-4712', capacity: 52, mileage: 1200, hasPassword: true, status: 'Active' });
  expect(record.capacity).toBe(52);
  const form = bus.toForm(record);
  expect(form).toEqual({ registration: 'NB-4712', capacity: 52, mileage: 1200, password: '', assignedDriver: '', status: 'Active' });
  expect(missingFields('bus', form, 'edit')).toEqual([]);
  expect(bus.toPayload(form)).toEqual({ registration: 'NB-4712', capacity: 52, mileage: 1200, password: '', assignedDriver: '', status: 'Active' });
});

test('status options come from the contract, default first', () => {
  expect(ENTITIES.bus.statuses).toEqual(['Active', 'Idle', 'Maintenance']);
  expect(ENTITIES.driver.blank.status).toBe('Active');
  expect(ENTITIES.route.statuses).toEqual(['Active', 'Inactive', 'Under Construction']);
});

test('the bus collection is /buses, not /buss', () => {
  expect(ENTITIES.bus.collection).toBe('buses');
});
