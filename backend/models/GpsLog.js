const mongoose = require('mongoose');

// Raw accepted GPS fixes. Written in batches off the live path and expired after 14 days.
const gpsLogSchema = new mongoose.Schema({
  busId: { type: String, index: true },
  routeId: String,
  tripId: String,
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] }, // [lng, lat]
  speed: Number,
  heading: Number,
  deviceTs: Date,
  serverTs: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 14 },
  buffered: { type: Boolean, default: false }, // arrived in an offline-buffer batch
});
gpsLogSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('GpsLog', gpsLogSchema);
