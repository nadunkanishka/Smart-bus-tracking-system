const mongoose = require('mongoose');

// Predicted vs actual arrival at a stop, for the mean-absolute-ETA-error evaluation metric.
const etaLogSchema = new mongoose.Schema({
  routeId: { type: String, index: true },
  tripId: String,
  busId: String,
  stopIndex: Number,
  predictedAt: Date,
  predictedArrival: Date,
  actualArrival: Date,
  horizonSec: Number, // how far ahead the prediction was made
  errorSec: Number, // predicted - actual (negative = bus arrived later than predicted)
});

module.exports = mongoose.model('EtaLog', etaLogSchema);
