const mongoose = require('mongoose');
const { STATUS } = require('../lib/contract');

const busSchema = new mongoose.Schema(
  {
    busId: {
      type: String,
      unique: true,
    },
    registration: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Seating capacity must be at least 1'],
    },
    mileage: {
      type: Number,
      required: [true, 'Initial mileage is required'],
      min: [0, 'Initial mileage cannot be negative'],
    },
    password: {
      type: String,
      default: '',
    },
    // driverId (e.g. DRV-001) of the driver assigned to this bus
    assignedDriver: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: STATUS.bus,
      default: STATUS.bus[0],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Bus', busSchema);
