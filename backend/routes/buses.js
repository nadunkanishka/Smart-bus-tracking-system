const express = require('express');
const { hashPassword } = require('../lib/auth');
const { nextId } = require('../lib/sequence');
const { pick, withoutBlankStatus, idQuery, badRequest } = require('../lib/crud');
const { formatBusRef, routesUsing } = require('../lib/busRef');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');

const router = express.Router();

// The bus password is write-only: responses carry hasPassword instead of the value.
const busView = (bus) => {
  const { password, ...rest } = bus.toObject ? bus.toObject() : bus;
  return { ...rest, hasPassword: !!password };
};

const EDITABLE = ['registration', 'capacity', 'mileage', 'assignedDriver', 'status'];
const byId = (id) => idQuery(id, ['busId', 'registration']);

async function checkDriver(driverId) {
  if (driverId && !(await Driver.exists({ driverId }))) throw badRequest(`Driver ${driverId} does not exist`);
}

router.get('/api/buses', async (req, res) => {
  const buses = await Bus.find().sort({ createdAt: -1 });
  res.json(buses.map(busView));
});

router.get('/api/buses/:id', async (req, res) => {
  const bus = await Bus.findOne(byId(req.params.id));
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  return res.json(busView(bus));
});

router.post('/api/buses', async (req, res) => {
  const { password } = req.body;
  await checkDriver(req.body.assignedDriver);
  const bus = new Bus({
    ...withoutBlankStatus(pick(req.body, EDITABLE)),
    busId: await nextId('bus'),
    capacity: Number(req.body.capacity),
    mileage: Number(req.body.mileage),
    password: password ? hashPassword(String(password)) : '',
    assignedDriver: req.body.assignedDriver || '',
  });
  res.status(201).json(busView(await bus.save()));
});

router.put('/api/buses/:id', async (req, res) => {
  const data = pick(req.body, EDITABLE);
  if (data.capacity !== undefined) data.capacity = Number(data.capacity);
  if (data.mileage !== undefined) data.mileage = Number(data.mileage);
  if (req.body.password) data.password = hashPassword(String(req.body.password)); // blank = keep the current password
  if (data.assignedDriver) await checkDriver(data.assignedDriver);

  const before = await Bus.findOne(byId(req.params.id));
  if (!before) return res.status(404).json({ error: 'Bus not found' });
  const updated = await Bus.findOneAndUpdate({ _id: before._id }, data, { new: true, runValidators: true });

  // Renaming the registration must not orphan the routes that point at this bus.
  if (updated.registration !== before.registration) {
    const routes = await Route.find(routesUsing(before));
    await Promise.all(routes.map((r) => Route.updateOne({ _id: r._id }, { assignedBus: formatBusRef(updated) })));
  }
  return res.json(busView(updated));
});

router.delete('/api/buses/:id', async (req, res) => {
  const deleted = await Bus.findOneAndDelete(byId(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Bus not found' });
  // Routes lose their assignment instead of pointing at a bus that no longer exists.
  const freed = await Route.updateMany(routesUsing(deleted), { assignedBus: '' });
  return res.json({ message: 'Bus deleted successfully', id: req.params.id, unassignedRoutes: freed.modifiedCount });
});

module.exports = router;
