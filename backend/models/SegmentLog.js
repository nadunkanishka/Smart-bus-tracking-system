const mongoose = require('mongoose');

// One measured crossing of a route segment (stop i -> stop i+1). The averages of these are the ETA engine's
// historical baseline, and their spread is the per-segment journey-time distribution shown to admins.
const segmentLogSchema = new mongoose.Schema({
  routeId: { type: String, required: true },
  segIndex: { type: Number, required: true },
  direction: { type: String, default: 'out' }, // 'back': the route reversed (segIndex counts from the other end)
  tripId: String,
  busId: String,
  traversalSec: { type: Number, required: true },
  dwellSec: { type: Number, default: 0 },
  at: { type: Date, default: Date.now },
});
segmentLogSchema.index({ routeId: 1, segIndex: 1 });

module.exports = mongoose.model('SegmentLog', segmentLogSchema);
