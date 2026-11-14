const express = require('express');
const mongoose = require('mongoose');

// services: { store, io } built by index.js before the routes are mounted.
module.exports = ({ store, io }) => {
  const router = express.Router();

  router.get('/api/health', (req, res) => {
    const mongo = mongoose.connection.readyState === 1;
    res.status(mongo ? 200 : 503).json({
      status: mongo ? 'ok' : 'degraded',
      message: 'Smart Bus Tracking API is running',
      mongo: mongo ? 'connected' : 'disconnected',
      cache: store.kind,
      sockets: io.engine.clientsCount,
    });
  });

  return router;
};
