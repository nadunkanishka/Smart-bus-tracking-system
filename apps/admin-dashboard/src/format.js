// Display strings, made where a value is shown. Records keep raw values (numbers stay numbers).

// Seconds as m:ss, or a dash when there is no value.
export const mmss = (sec) => (sec == null ? '—' : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`);

export const seats = (n) => `${n} seats`;
export const mileageKm = (n) => `${Number(n || 0).toLocaleString('en-US')} km`;
export const distanceKm = (n) => `${n} km`;

// The signed-in admin, as the header and the settings page show them.
export const displayName = (user) => user.name || user.username;
export const initials = (user) => displayName(user).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const roleLabel = (user) => user.role || 'Administrator';
