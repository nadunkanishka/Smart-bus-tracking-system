const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    license: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    expiry: {
      type: String,
      required: [true, 'License expiry date is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Driver', driverSchema);
