// Removes trips and logs produced by simulated buses (SIM-xx from the replay tool, LOAD-xxxx from the load test)
// so they do not distort the ETA engine's historical baseline.   Usage: npm run clear-sim
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  if (!(await connectDB())) process.exit(1);
  const sim = { busId: /^(SIM|LOAD)-/ };
  for (const name of ['Trip', 'SegmentLog', 'EtaLog', 'GpsLog']) {
    const { deletedCount } = await require(`../models/${name}`).deleteMany(sim); // eslint-disable-line global-require
    console.log(`${name}: removed ${deletedCount}`);
  }
  await mongoose.disconnect();
})();
