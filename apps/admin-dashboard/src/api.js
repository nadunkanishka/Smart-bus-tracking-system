// Set REACT_APP_API_URL (e.g. https://api.example.com) for deployed builds.
export const API_BASE = `${(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '')}/api`;

// Every request after login carries the admin token.
let authToken = '';
export const setAuthToken = (token) => { authToken = token; };
export const api = (path, options = {}) => fetch(`${API_BASE}${path}`, {
  ...options,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}`, ...options.headers },
});

// JSON call that throws Error(server message) on a non-2xx response, for pages that manage their own state.
export async function apiJson(path, method = 'GET', body) {
  const res = await api(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
  return data;
}
