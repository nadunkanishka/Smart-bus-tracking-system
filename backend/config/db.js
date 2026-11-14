const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

// Resolves true when connected; logs and resolves false otherwise (callers decide whether that is fatal).
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
