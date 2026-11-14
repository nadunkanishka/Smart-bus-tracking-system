// What the admin knows about drivers, buses and routes, in one table: where each lives in the API, its labels, its
// status options, its blank form, how an API record becomes a row and a row becomes a form, how a form becomes the
// payload sent back, and which fields must be filled in. Records keep raw values; see format.js for display strings.
import { STATUS } from './design/contract';

const text = (v) => String(v ?? '').trim();

export const ENTITIES = {
  driver: {
    collection: 'drivers',
    noun: 'Driver',
    nameField: 'name',
    icon: 'user',
    labels: {
      add: 'Add New Driver',
      edit: 'Edit Driver',
      addButton: 'Add New Driver',
      subtitle: 'Manage and register system drivers stored in MongoDB',
      loading: 'Loading drivers…',
      empty: 'No drivers registered yet. Click "Add New Driver" to add one!',
    },
    statuses: STATUS.driver,
    blank: { name: '', license: '', expiry: '', phone: '', status: STATUS.driver[0] },
    fromApi: (d) => ({
      id: d.driverId || d._id || d.id,
      rawId: d._id,
      name: d.name,
      license: d.license,
      expiry: d.expiry,
      phone: d.phone,
      status: d.status || STATUS.driver[0],
    }),
    toForm: (r) => ({ name: r.name, license: r.license, expiry: r.expiry, phone: r.phone, status: r.status || STATUS.driver[0] }),
    required: [['name', 'full name'], ['license', 'license number'], ['expiry', 'license expiry'], ['phone', 'phone number']],
    rules: [],
    toPayload: (f) => ({ name: text(f.name), license: text(f.license), expiry: f.expiry, phone: text(f.phone), status: f.status || STATUS.driver[0] }),
  },

  bus: {
    collection: 'buses', // not noun + "s": /buss does not exist
    noun: 'Bus',
    nameField: 'registration',
    icon: 'bus',
    labels: {
      add: 'Add New Bus',
      edit: 'Edit Bus',
      addButton: 'Add New Bus',
      subtitle: 'Register new transit buses into MongoDB inventory',
      loading: 'Loading buses…',
      empty: 'No buses registered yet. Click "Add New Bus" to register a bus!',
    },
    statuses: STATUS.bus,
    blank: { registration: '', capacity: '', mileage: '', password: '', assignedDriver: '', status: STATUS.bus[0] },
    fromApi: (b) => ({
      id: b.busId || b._id || b.id,
      rawId: b._id,
      registration: b.registration,
      capacity: b.capacity,
      mileage: b.mileage,
      hasPassword: !!b.hasPassword,
      assignedDriver: b.assignedDriver || '',
      status: b.status || STATUS.bus[0],
    }),
    toForm: (r) => ({
      registration: r.registration,
      capacity: r.capacity ?? '',
      mileage: r.mileage ?? '',
      password: '', // write-only: blank keeps the current password
      assignedDriver: r.assignedDriver || '',
      status: r.status || STATUS.bus[0],
    }),
    required: [['registration', 'registration number'], ['capacity', 'seating capacity'], ['mileage', 'mileage']],
    rules: [(f, mode) => (mode !== 'edit' && !f.password ? 'bus password' : null)],
    toPayload: (f) => ({
      registration: text(f.registration),
      capacity: Number(f.capacity),
      mileage: Number(f.mileage),
      password: f.password || '',
      assignedDriver: f.assignedDriver || '',
      status: f.status || STATUS.bus[0],
    }),
  },

  route: {
    collection: 'routes',
    noun: 'Route',
    nameField: 'name',
    icon: 'route',
    labels: {
      add: 'Create New Route',
      edit: 'Edit Route',
      addButton: 'Create Route',
      subtitle: 'Setup network paths and intermediate stop lists in MongoDB',
      loading: 'Loading routes…',
      empty: 'No network routes created yet. Click "Create Route" to create one!',
    },
    statuses: STATUS.route,
    blank: { name: '', routeNumber: '', start: '', end: '', distance: '', stopPoints: [], path: [], assignedBus: '', status: STATUS.route[0] },
    fromApi: (r) => ({
      id: r.routeId || r._id || r.id,
      rawId: r._id,
      name: r.name,
      start: r.start,
      end: r.end,
      distance: r.distance,
      routeNumber: r.routeNumber || '',
      stops: Array.isArray(r.stops) ? r.stops : [],
      // GeoJSON [lng, lat] from the API -> [lat, lng] for the map editor
      stopPoints: (r.stopPoints || []).map((sp) => ({ name: sp.name, lat: sp.location.coordinates[1], lng: sp.location.coordinates[0] })),
      path: (r.path?.coordinates || []).map(([lng, lat]) => [lat, lng]),
      assignedBus: r.assignedBus || '',
      status: r.status || STATUS.route[0],
    }),
    toForm: (r) => ({
      name: r.name,
      start: r.start,
      end: r.end,
      distance: r.distance ?? '',
      routeNumber: r.routeNumber || '',
      stopPoints: r.stopPoints || [],
      path: r.path || [],
      assignedBus: r.assignedBus || '',
      status: r.status || STATUS.route[0],
    }),
    required: [['name', 'route name'], ['start', 'start terminal'], ['end', 'end terminal'], ['distance', 'distance']],
    rules: [(f) => ((f.stopPoints || []).some((sp) => !text(sp.name)) ? 'a name for every stop' : null)],
    toPayload: (f) => {
      const stopPoints = (f.stopPoints || []).map((sp) => ({ ...sp, name: text(sp.name) }));
      return {
        name: text(f.name),
        routeNumber: text(f.routeNumber),
        start: text(f.start),
        end: text(f.end),
        distance: Number(f.distance),
        stopPoints,
        stops: stopPoints.map((sp) => sp.name),
        path: f.path || [],
        assignedBus: f.assignedBus || '',
        status: f.status || STATUS.route[0],
      };
    },
  },
};

// The labels of the fields still missing, in form order ([] when the form can be saved).
export function missingFields(entity, form, mode) {
  const def = ENTITIES[entity];
  const missing = def.required.filter(([key]) => !text(form[key])).map(([, label]) => label);
  return [...missing, ...def.rules.map((rule) => rule(form, mode)).filter(Boolean)];
}

// The id the API addresses a record by (its Mongo _id when known).
export const recordKey = (record) => record.rawId || record.id;

// The label shown for a record in messages, e.g. "Bus NB-4712" (or "Bus: NB-4712" with sep ': ').
export const recordLabel = (entity, record, sep = ' ') => `${ENTITIES[entity].noun}${sep}${record[ENTITIES[entity].nameField]}`;

// A route the map, the ETA engine and the passenger app can follow: a drawn path and at least two stops.
export const routeReady = (route) => route.path.length > 1 && route.stopPoints.length > 1;
