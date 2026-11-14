// The admin's only door to the backend: sign-in, the saved session, every request, and signing out when the server
// stops accepting the token. Set REACT_APP_API_URL (e.g. https://api.example.com) for deployed builds.
export const API_BASE = `${(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '')}/api`;

// The signed-in admin ({ ...user, token }) lives in sessionStorage, so it ends with the browser tab.
const SESSION_KEY = 'adminUser';
export const SESSION_EXPIRED = 'Your session has expired. Please sign in again.';

export const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null; // unreadable saved session: treat as signed out
  }
};

let signOutNotice = '';
const signOutListeners = new Set();

// The message the sign-in page shows after an automatic sign-out ('' after a normal one).
export const getSignOutNotice = () => signOutNotice;
// Calls fn() whenever the admin is signed out; returns the unsubscribe function.
export const onSignOut = (fn) => {
  signOutListeners.add(fn);
  return () => signOutListeners.delete(fn);
};

export function signOut(notice = '') {
  signOutNotice = notice;
  sessionStorage.removeItem(SESSION_KEY);
  signOutListeners.forEach((fn) => fn());
}

// Signs in and saves the session. Resolves to the user; rejects with Error(message to show).
export async function login({ username, password }) {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error('Could not connect to backend server. Make sure node backend is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Invalid credentials');
  const user = { ...data.user, token: data.token };
  signOutNotice = '';
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

// Every request carries the admin token. A 401 or 403 means the token is no longer accepted (expired, or issued before
// roles existed), so the admin is signed out. Pass { keepSession: true } where a 401 means something else (a wrong
// current password). A network failure rejects with Error('could not reach the backend server.').
export async function api(path, { keepSession = false, ...options } = {}) {
  const session = getSession();
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token || ''}`, ...options.headers },
    });
  } catch {
    throw new Error('could not reach the backend server.');
  }
  if (!keepSession && session && (res.status === 401 || res.status === 403)) signOut(SESSION_EXPIRED);
  return res;
}

// JSON call that rejects with Error(server message) on a non-2xx response.
export async function apiJson(path, method = 'GET', body, options = {}) {
  const res = await api(path, { ...options, method, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({})); // an empty or non-JSON body is not an error by itself
  if (!res.ok) throw new Error(data.error || `server returned ${res.status}`);
  return data;
}
