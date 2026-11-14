/* eslint-env jest */
// A fake fetch for tests: `routes` maps "METHOD /path" (or "/path" for any method) to { status, body }.
// Unknown paths answer 404. Every call is recorded in fetch.mock.calls.
export function mockFetch(routes) {
  global.fetch = jest.fn(async (url, options = {}) => {
    const path = String(url).replace(/^.*\/api/, '');
    const method = options.method || 'GET';
    const hit = routes[`${method} ${path}`] || routes[path] || { status: 404, body: { error: 'not found' } };
    const status = hit.status ?? 200;
    return { ok: status >= 200 && status < 300, status, json: async () => hit.body };
  });
  return global.fetch;
}

export const signedInAs = (user) => sessionStorage.setItem('adminUser', JSON.stringify(user));
