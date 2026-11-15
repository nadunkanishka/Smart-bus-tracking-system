import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminsPage from './AdminsPage';
import PassengersPage from './PassengersPage';
import { mockFetch, signedInAs } from '../test/fetchMock';

const writes = (fetch) => fetch.mock.calls.filter(([, options]) => options && options.method && options.method !== 'GET');

beforeEach(() => signedInAs({ id: 'a1', username: 'admin', token: 't' }));

describe('PassengersPage', () => {
  const passengers = [
    { id: 'p1', username: 'kasun', name: 'Kasun Perera', phone: '0711111111', createdAt: '2026-11-01T00:00:00Z' },
    { id: 'p2', username: 'nimali', name: 'Nimali Silva', phone: '', createdAt: null },
  ];

  test('lists the accounts and says when a phone number was not given', async () => {
    mockFetch({ '/passengers': { status: 200, body: passengers } });
    render(<PassengersPage showNotification={jest.fn()} />);
    expect(await screen.findByText('Kasun Perera')).toBeInTheDocument();
    expect(screen.getByText('@nimali')).toBeInTheDocument();
    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  test('a delete is confirmed first; cancelling sends nothing, confirming removes the account and reloads', async () => {
    const fetch = mockFetch({ '/passengers': { status: 200, body: passengers }, 'DELETE /passengers/p1': { status: 200, body: {} } });
    const showNotification = jest.fn();
    render(<PassengersPage showNotification={showNotification} />);
    const row = (await screen.findByText('Kasun Perera')).closest('tr');

    fireEvent.click(within(row).getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(writes(fetch)).toHaveLength(0);

    fireEvent.click(within(row).getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Item' }));
    await waitFor(() => expect(showNotification).toHaveBeenCalledWith('Passenger Kasun Perera deleted.'));
    expect(writes(fetch)[0][0]).toMatch(/\/passengers\/p1$/);
  });

  test('a failed load says so instead of showing an empty table silently', async () => {
    mockFetch({ '/passengers': { status: 500, body: { error: 'database down' } } });
    const showNotification = jest.fn();
    render(<PassengersPage showNotification={showNotification} />);
    await waitFor(() => expect(showNotification).toHaveBeenCalledWith('Could not load passengers: database down'));
    expect(screen.getByText('No passengers have registered yet.')).toBeInTheDocument();
  });
});

describe('AdminsPage', () => {
  const admins = [
    { id: 'a1', username: 'admin', name: 'Nimali', role: 'Super Admin', createdAt: '2026-11-01T00:00:00Z' },
    { id: 'a2', username: 'dispatcher', name: 'Kasun', role: 'Admin', createdAt: '2026-11-02T00:00:00Z' },
  ];

  test('you cannot delete the account you are signed in with', async () => {
    mockFetch({ '/admins': { status: 200, body: admins } });
    render(<AdminsPage user={{ id: 'a1' }} showNotification={jest.fn()} />);
    const mine = (await screen.findByText('admin')).closest('tr');
    expect(within(mine).getByText('You')).toBeInTheDocument();
    expect(within(mine).getByRole('button', { name: /delete/i })).toBeDisabled();
    const other = screen.getByText('dispatcher').closest('tr');
    expect(within(other).getByRole('button', { name: /delete/i })).toBeEnabled();
  });

  test('adding an administrator posts the trimmed username and the password, then reloads the list', async () => {
    const fetch = mockFetch({ '/admins': { status: 200, body: admins }, 'POST /admins': { status: 201, body: {} } });
    const showNotification = jest.fn();
    render(<AdminsPage user={{ id: 'a1' }} showNotification={showNotification} />);
    await screen.findByText('dispatcher');

    fireEvent.click(screen.getByRole('button', { name: /add administrator/i }));
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: '  night.shift ' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Night Shift' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Str0ng-pass' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(showNotification).toHaveBeenCalledWith('Administrator night.shift added.'));
    const [[url, options]] = writes(fetch);
    expect(url).toMatch(/\/admins$/);
    expect(JSON.parse(options.body)).toEqual({ username: 'night.shift', name: 'Night Shift', password: 'Str0ng-pass' });
  });

  test('a rejected password change shows the reason inside the dialog and keeps what was typed', async () => {
    mockFetch({ '/admins': { status: 200, body: admins }, 'PUT /admins/me/password': { status: 401, body: { error: 'Current password is incorrect.' } } });
    render(<AdminsPage user={{ id: 'a1' }} showNotification={jest.fn()} />);
    await screen.findByText('dispatcher');

    fireEvent.click(screen.getByRole('button', { name: /change my password/i }));
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'Another-pass1' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.');
    expect(screen.getByLabelText(/current password/i)).toHaveValue('wrong');
  });
});
