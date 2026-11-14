// Small helpers shared by the CRUD route files.
const mongoose = require('mongoose');

// Keep only the listed keys that the client actually sent, so a request body can never set _id, busId, password hashes, etc.
const pick = (body, keys) => Object.fromEntries(keys.filter((k) => body && body[k] !== undefined).map((k) => [k, body[k]]));

// A blank or missing status is left out, so the schema applies its default (the first allowed value).
const withoutBlankStatus = ({ status, ...rest }) => (status ? { ...rest, status } : rest);

// Match a record by its Mongo _id or by any of its public identifier fields (driverId, busId, ...).
const idQuery = (id, fields) => ({
  $or: [...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []), ...fields.map((f) => ({ [f]: String(id) }))],
});

// An error a route handler throws on purpose; the error handler answers with this status and message.
const httpError = (status, message) => Object.assign(new Error(message), { status, expose: true });
const badRequest = (message) => httpError(400, message);

const FIELD_LABELS = { registration: 'registration number', license: 'license number', username: 'username', routeId: 'route id', busId: 'bus id', driverId: 'driver id' };

// Turns any error into { status, error }: duplicate keys become 409 with a readable message, invalid input 400,
// errors thrown with httpError() keep their status, anything else is a 500.
function describeError(err) {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const value = field && err.keyValue ? err.keyValue[field] : '';
    return { status: 409, error: `That ${FIELD_LABELS[field] || field || 'value'}${value ? ` (${value})` : ''} is already in use.` };
  }
  if (err && err.name === 'CastError') return { status: 400, error: `Invalid value for ${err.path}.` };
  if (err && err.name === 'ValidationError') return { status: 400, error: err.message };
  if (err && err.expose && err.status) return { status: err.status, error: err.message };
  return { status: 500, error: err ? err.message : 'Server error' };
}

module.exports = { pick, withoutBlankStatus, idQuery, httpError, badRequest, describeError };
