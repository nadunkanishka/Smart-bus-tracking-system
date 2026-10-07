const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    routeId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    start: {
      type: String,
      required: [true, 'Start terminal is required'],
      trim: true,
    },
    end: {
      type: String,
      required: [true, 'End terminal is required'],
      trim: true,
    },
    distance: {
      type: Number,
      required: [true, 'Distance in km is required'],
      min: [0, 'Distance cannot be negative'],
    },
    routeNumber: {
      type: String,
      default: '',
      trim: true,
    },
    // Stop names in travel order (kept in sync with stopPoints for older clients).
    stops: {
      type: [String],
      default: [],
    },
    // Road geometry as GeoJSON: coordinates are [lng, lat].
    path: {
      type: { type: String, enum: ['LineString'] },
      coordinates: { type: [[Number]], default: undefined },
    },
    // Registered stops with coordinates, in travel order. Consecutive stops define the ETA segments.
    stopPoints: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
          },
        },
      ],
      default: [],
    },
    assignedBus: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Construction'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ path: '2dsphere' });
routeSchema.index({ 'stopPoints.location': '2dsphere' });

module.exports = mongoose.model('Route', routeSchema);
