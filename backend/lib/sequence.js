const Counter = require('../models/Counter');
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

// The next record id of a kind ('bus', 'driver', 'route'): BUS-001, DRV-001, RT-001. The counter is named after the kind.
const nextId = async (kind) => formatId(kind, await getNextSequence(kind));

module.exports = { getNextSequence, nextId };
