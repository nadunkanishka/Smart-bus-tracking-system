const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    username: { type: String, required: [true, 'Username is required'], unique: true, trim: true, lowercase: true },
    password: { type: String, required: [true, 'Password is required'] },
    name: { type: String, required: [true, 'Full name is required'], trim: true },
    phone: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Passenger', passengerSchema);
