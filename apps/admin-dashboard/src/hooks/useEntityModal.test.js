import { act, renderHook } from '@testing-library/react';
import { useEntityModal } from './useEntityModal';
import { mockFetch, signedInAs } from '../test/fetchMock';

const setup = (routes) => {
  signedInAs({ username: 'admin', token: 't' });
  const fetch = mockFetch(routes);
  const showNotification = jest.fn();
  const fetchBackendData = jest.fn();
  const hook = renderHook(() => useEntityModal({ showNotification, fetchBackendData }));
  return { fetch, showNotification, fetchBackendData, ...hook };
};
const writes = (fetch) => fetch.mock.calls.filter(([, options]) => options && options.method && options.method !== 'GET');
const fillDriver = (result) => act(() => {
  result.current.openModal('driver');
});
const set = (result, values) => act(() => {
  Object.entries(values).forEach(([key, value]) => result.current.updateField(key, value));
});

test('saving a form with a required field missing names the fields and sends nothing', async () => {
  const { result, fetch, showNotification } = setup({});
  fillDriver(result);
  set(result, { name: 'A. Bandara' });
  await act(() => result.current.handleSave());
  expect(showNotification).toHaveBeenCalledWith('Please fill in: license number, license expiry, phone number.');
  expect(writes(fetch)).toHaveLength(0);
  expect(result.current.modal.open).toBe(true);
});

test('a new driver is posted, announced, the dialog closes and the lists reload', async () => {
  const { result, fetch, showNotification, fetchBackendData } = setup({ 'POST /drivers': { status: 201, body: {} } });
  fillDriver(result);
  set(result, { name: ' A. Bandara ', license: 'LK-1', expiry: '2030-01-01', phone: '0711111111' });
  await act(() => result.current.handleSave());
  const [[url, options]] = writes(fetch);
  expect(url).toMatch(/\/drivers$/);
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toMatchObject({ name: 'A. Bandara', license: 'LK-1', status: 'Active' });
  expect(showNotification).toHaveBeenCalledWith(expect.stringMatching(/added\.$/));
  expect(result.current.modal.open).toBe(false);
  expect(fetchBackendData).toHaveBeenCalledTimes(1);
});

test('editing a bus puts to its database id and keeps the password blank so the server keeps the current one', async () => {
  const { result, fetch } = setup({ 'PUT /buses/64f0c1': { status: 200, body: {} } });
  const record = { id: 'BUS-007', rawId: '64f0c1', registration: 'NB-7', capacity: 40, mileage: 100, hasPassword: true, assignedDriver: '', routeId: '', status: 'Active' };
  act(() => result.current.openModal('bus', 'edit', record));
  expect(result.current.formData.password).toBe('');
  await act(() => result.current.handleSave());
  const [[url, options]] = writes(fetch);
  expect(url).toMatch(/\/buses\/64f0c1$/);
  expect(options.method).toBe('PUT');
  expect(JSON.parse(options.body).password).toBe('');
});

test('a server refusal shows its message and leaves the dialog open with the form intact', async () => {
  const { result, showNotification, fetchBackendData } = setup({ 'POST /drivers': { status: 409, body: { error: 'That license number (LK-1) is already in use.' } } });
  fillDriver(result);
  set(result, { name: 'A', license: 'LK-1', expiry: '2030-01-01', phone: '0711111111' });
  await act(() => result.current.handleSave());
  expect(showNotification).toHaveBeenCalledWith('Not saved: That license number (LK-1) is already in use.');
  expect(result.current.modal.open).toBe(true);
  expect(result.current.formData.license).toBe('LK-1');
  expect(fetchBackendData).not.toHaveBeenCalled();
});

test('deleting asks first: nothing is sent until it is confirmed, then the record goes and the lists reload', async () => {
  const { result, fetch, showNotification, fetchBackendData } = setup({ 'DELETE /routes/64f0c2': { status: 200, body: {} } });
  act(() => result.current.openConfirm('route', { id: 'RT-001', rawId: '64f0c2', name: 'R' }));
  expect(result.current.confirm.entity).toBe('route');
  expect(writes(fetch)).toHaveLength(0);
  await act(() => result.current.handleDelete());
  const [[url, options]] = writes(fetch);
  expect(url).toMatch(/\/routes\/64f0c2$/);
  expect(options.method).toBe('DELETE');
  expect(showNotification).toHaveBeenCalledWith('Route deleted.');
  expect(result.current.confirm).toBeNull();
  expect(fetchBackendData).toHaveBeenCalledTimes(1);
});
