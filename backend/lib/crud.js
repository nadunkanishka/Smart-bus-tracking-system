// Small helpers shared by the CRUD route files.
const mongoose = require('mongoose');

// Keep only the listed keys that the client actually sent, so a request body can never set _id, busId, password hashes, etc.
const pick = (body, keys) => Object.fromEntries(keys.filter((k) => body && body[k] !== undefined).map((k) => [k, body[k]]));

// Match a record by its Mongo _id or by any of its public identifier fields (driverId, busId, ...).
const idQuery = (id, fields) => ({
  $or: [...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []), ...fields.map((f) => ({ [f]: String(id) }))],
});

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const FIELD_LABELS = { registration: 'registration number', license: 'license number', username: 'username', routeId: 'route id', busId: 'bus id', driverId: 'driver id' };

// Turns a Mongoose/Mongo error into { status, error }: duplicate keys become 409 with a readable message.
function describeError(err, fallbackStatus = 400) {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const value = field && err.keyValue ? err.keyValue[field] : '';
    return { status: 409, error: `That ${FIELD_LABELS[field] || field || 'value'}${value ? ` (${value})` : ''} is already in use.` };
  }
  if (err && err.name === 'CastError') return { status: 400, error: `Invalid value for ${err.path}.` };
  return { status: fallbackStatus, error: err.message };
}

const fail = (res, err, fallbackStatus = 400) => {
  const { status, error } = describeError(err, fallbackStatus);
  return res.status(status).json({ error });
};

module.exports = { pick, idQuery, escapeRegex, describeError, fail };
