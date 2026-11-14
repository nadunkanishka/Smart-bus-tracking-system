// One-off: turns the old Route.assignedBus text ("NB-4712 (BUS-002)") into Bus.routeId, then removes the old field.
// Usage: node scripts/migrate-bus-routes.js     (safe to run twice; a bus already on a route is left alone)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Bus = require('../models/Bus');
const { parseBusRef } = require('../lib/contract');

// The bus a reference names: by the id in brackets when there is one, else by bus id or registration.
function busQueryFor(text) {
  const { registration, busId } = parseBusRef(text);
  return busId ? { busId } : { $or: [{ busId: registration }, { registration }] };
}

(async () => {
  if (!(await connectDB())) process.exit(1);
  // The field is gone from the schema, so read the raw collection.
  const routes = mongoose.connection.collection('routes');
  let moved = 0;
  for (const route of await routes.find({ assignedBus: { $exists: true } }).toArray()) {
    if (route.assignedBus) {
      const bus = await Bus.findOne(busQueryFor(route.assignedBus));
      if (!bus) console.warn(`${route.routeId}: no bus matches "${route.assignedBus}", left unassigned`);
      else if (bus.routeId && bus.routeId !== route.routeId) console.warn(`${route.routeId}: ${bus.busId} is already on ${bus.routeId}, left there`);
      else { bus.routeId = route.routeId; await bus.save(); moved += 1; console.log(`${bus.busId} -> ${route.routeId}`); }
    }
    await routes.updateOne({ _id: route._id }, { $unset: { assignedBus: '' } });
  }
  console.log(`Done: ${moved} bus(es) linked to their route.`);
  await mongoose.disconnect();
})();
