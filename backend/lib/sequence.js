const Counter = require('../models/Counter');

// Helper for auto-increment counter starting from 1
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

module.exports = { getNextSequence };
