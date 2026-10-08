// Set REACT_APP_API_URL (e.g. https://api.example.com) for deployed builds.
export const API_BASE = `${(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '')}/api`;

// Every request after login carries the admin token.
let authToken = '';
export const setAuthToken = (token) => { authToken = token; };
export const api = (path, options = {}) => fetch(`${API_BASE}${path}`, {
  ...options,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}`, ...options.headers },
});
