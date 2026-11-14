import { api, apiJson, getSession, getSignOutNotice, login, onSignOut } from './api';
import { mockFetch, signedInAs } from './test/fetchMock';

describe('login', () => {
  test('saves the session with the token on success', async () => {
    mockFetch({ 'POST /auth/login': { status: 200, body: { token: 'tok-1', user: { id: 'a1', username: 'admin', role: 'admin' } } } });
    const user = await login({ username: 'admin', password: 'secret123' });
    expect(user).toEqual({ id: 'a1', username: 'admin', role: 'admin', token: 'tok-1' });
    expect(getSession()).toEqual({ id: 'a1', username: 'admin', role: 'admin', token: 'tok-1' });
  });

  test('rejects with the server message and saves nothing on failure', async () => {
    mockFetch({ 'POST /auth/login': { status: 401, body: { error: 'Invalid username or password' } } });
    await expect(login({ username: 'admin', password: 'wrong' })).rejects.toThrow('Invalid username or password');
    expect(getSession()).toBeNull();
  });

  test('rejects with a connection message when the server cannot be reached', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(login({ username: 'admin', password: 'x' })).rejects.toThrow('Could not connect to backend server. Make sure node backend is running.');
  });
});

describe('a rejected token', () => {
  test('a 401 on a write signs the admin out', async () => {
    signedInAs({ username: 'admin', token: 'old' });
    mockFetch({ 'POST /buses': { status: 401, body: { error: 'Sign in required' } } });
    const listener = jest.fn();
    const off = onSignOut(listener);
    await expect(apiJson('/buses', 'POST', { registration: 'NB-1' })).rejects.toThrow('Sign in required');
    off();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getSession()).toBeNull();
    expect(getSignOutNotice()).toBe('Your session has expired. Please sign in again.');
  });

  test('sends the saved token', async () => {
    signedInAs({ username: 'admin', token: 'tok-9' });
    const fetch = mockFetch({ '/passengers': { status: 200, body: [] } });
    await api('/passengers');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-9');
  });

  test('keepSession: a 401 for a wrong current password keeps the admin signed in', async () => {
    signedInAs({ username: 'admin', token: 'tok-2' });
    mockFetch({ 'PUT /admins/me/password': { status: 401, body: { error: 'Current password is incorrect.' } } });
    await expect(apiJson('/admins/me/password', 'PUT', { currentPassword: 'x', newPassword: 'y' }, { keepSession: true })).rejects.toThrow('Current password is incorrect.');
    expect(getSession()).toEqual({ username: 'admin', token: 'tok-2' });
  });
});
