const express = require('express');
const { hashPassword } = require('../lib/auth');
const { getNextSequence } = require('../lib/sequence');
const { pick, idQuery, escapeRegex, fail } = require('../lib/crud');
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

// A route stores its bus as "NB-4712 (BUS-002)". These match every route that points at this bus.
const routesUsing = (bus) => ({ $or: [{ assignedBus: new RegExp(`\\(${escapeRegex(bus.busId)}\\)\\s*$`) }, { assignedBus: bus.registration }] });

async function checkDriver(driverId) {
  if (driverId && !(await Driver.exists({ driverId }))) throw new Error(`Driver ${driverId} does not exist`);
}

router.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    res.json(buses.map(busView));
  } catch (error) {
    fail(res, error, 500);
  }
});

router.get('/api/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findOne(byId(req.params.id));
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    return res.json(busView(bus));
  } catch (error) {
    return fail(res, error);
  }
});

router.post('/api/buses', async (req, res) => {
  try {
    const { password } = req.body;
    await checkDriver(req.body.assignedDriver);
    const seq = await getNextSequence('bus');
    const busId = `BUS-${String(seq).padStart(3, '0')}`;

    const bus = new Bus({
      ...pick(req.body, EDITABLE),
      busId,
      capacity: Number(req.body.capacity),
      mileage: Number(req.body.mileage),
      password: password ? hashPassword(String(password)) : '',
      assignedDriver: req.body.assignedDriver || '',
      status: req.body.status || 'Active',
    });
    const saved = await bus.save();
    res.status(201).json(busView(saved));
  } catch (error) {
    fail(res, error);
  }
});

router.put('/api/buses/:id', async (req, res) => {
  try {
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
      await Promise.all(routes.map((r) => Route.updateOne({ _id: r._id }, { assignedBus: `${updated.registration} (${updated.busId})` })));
    }
    return res.json(busView(updated));
  } catch (error) {
    return fail(res, error);
  }
});

router.delete('/api/buses/:id', async (req, res) => {
  try {
    const deleted = await Bus.findOneAndDelete(byId(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Bus not found' });
    // Routes lose their assignment instead of pointing at a bus that no longer exists.
    const freed = await Route.updateMany(routesUsing(deleted), { assignedBus: '' });
    return res.json({ message: 'Bus deleted successfully', id: req.params.id, unassignedRoutes: freed.modifiedCount });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
