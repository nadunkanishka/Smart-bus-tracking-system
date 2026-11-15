const Counter = require('../models/Counter');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const { formatId } = require('./contract');

// Auto-increment counter per name, starting from 1.
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// Where each kind's ids are stored, so a new id can be checked against the records that already exist.
const STORE = { bus: [Bus, 'busId'], driver: [Driver, 'driverId'], route: [Route, 'routeId'] };
const MAX_SKIPS = 100000;

// The next record id of a kind ('bus', 'driver', 'route'): BUS-001, DRV-001, RT-001. The counter is named after the kind.
// Records imported or added outside the API can hold ids the counter has not reached; those ids are skipped (and the
// counter stays ahead of them), so the next record never fails with "already in use".
async function nextId(kind) {
  const [Model, field] = STORE[kind] || [];
  for (let i = 0; i < MAX_SKIPS; i += 1) {
    const id = formatId(kind, await getNextSequence(kind));
    if (!Model || !(await Model.exists({ [field]: id }))) return id;
  }
  throw new Error(`Could not find a free ${kind} id`);
}

module.exports = { nextId };
