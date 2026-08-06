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
    stops: {
      type: [String],
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

module.exports = mongoose.model('Route', routeSchema);
