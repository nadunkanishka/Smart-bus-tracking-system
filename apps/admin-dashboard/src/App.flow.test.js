import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { mockFetch, signedInAs } from './test/fetchMock';

const EMPTY_LISTS = {
  '/drivers': { status: 200, body: [] },
  '/buses': { status: 200, body: [] },
  '/routes': { status: 200, body: [] },
  '/dashboard/summary': { status: 200, body: { activeRoutes: 0, registeredBuses: 0, activeDrivers: 0, fleetDistribution: { active: 0, idle: 0, maintenance: 0 } } },
};

const signIn = () => {
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'admin' } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in to dashboard/i }));
};

test('a successful sign-in opens the console', async () => {
  mockFetch({ ...EMPTY_LISTS, 'POST /auth/login': { status: 200, body: { token: 't', user: { id: 'a1', username: 'admin', name: 'Nimali Silva', role: 'admin' } } } });
  render(<App />);
  signIn();
  expect(await screen.findByRole('heading', { name: 'Administrator Dashboard' })).toBeInTheDocument();
  expect(screen.getByText('NS')).toBeInTheDocument();
});

test('a failed sign-in shows the server message and stays on the form', async () => {
  mockFetch({ 'POST /auth/login': { status: 401, body: { error: 'Invalid username or password' } } });
  render(<App />);
  signIn();
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password');
  expect(screen.getByRole('heading', { name: /admin sign in/i })).toBeInTheDocument();
});

test('a 401 while the console loads signs the admin out with a notice', async () => {
  signedInAs({ id: 'a1', username: 'admin', token: 'expired' });
  mockFetch({ ...EMPTY_LISTS, '/drivers': { status: 401, body: { error: 'Sign in required' } } });
  render(<App />);
  expect(await screen.findByRole('heading', { name: /admin sign in/i })).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Your session has expired. Please sign in again.');
  await waitFor(() => expect(sessionStorage.getItem('adminUser')).toBeNull());
});
