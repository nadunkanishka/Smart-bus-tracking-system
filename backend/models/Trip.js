const mongoose = require('mongoose');

// One run of a bus along its route. Segment and ETA logs reference it by tripId.
const tripSchema = new mongoose.Schema(
  {
    tripId: { type: String, unique: true },
    busId: { type: String, index: true },
    registration: String,
    routeId: { type: String, index: true },
    startedAt: Date,
    endedAt: Date,
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
