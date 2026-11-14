// How a route names its bus ("NB-4712 (BUS-002)", or a plain registration / bus id) and the MongoDB queries that
// follow such a reference in either direction. The text format itself is in the shared contract.
const { formatBusRef, parseBusRef } = require('./contract');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Route queries that point at this bus, most specific first: the bus id in brackets, then the exact registration.
// A substring match would give bus NB-1 the route of bus NB-12.
const routeQueriesFor = (bus) => [
  { assignedBus: new RegExp(`\\(${escapeRegex(bus.busId)}\\)\\s*$`) },
  { assignedBus: bus.registration },
];

// Every route that points at this bus.
const routesUsing = (bus) => ({ $or: routeQueriesFor(bus) });

// The bus a reference names: by the id in brackets when there is one, else by bus id or registration.
function busQueryFor(text) {
  const { registration, busId } = parseBusRef(text);
  return busId ? { busId } : { $or: [{ busId: registration }, { registration }] };
}

module.exports = { formatBusRef, parseBusRef, routeQueriesFor, routesUsing, busQueryFor };
