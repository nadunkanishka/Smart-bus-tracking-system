const express = require('express');
const mongoose = require('mongoose');

// state: { store, realtime } filled in by index.js once the latest-fix store is ready.
module.exports = (state, io) => {
  const router = express.Router();

  // Health Check
  router.get('/api/health', (req, res) => {
    const mongo = mongoose.connection.readyState === 1;
    res.status(mongo ? 200 : 503).json({
      status: mongo ? 'ok' : 'degraded',
      message: 'Smart Bus Tracking API is running',
      mongo: mongo ? 'connected' : 'disconnected',
      cache: state.store ? state.store.kind : 'starting',
      sockets: io.engine.clientsCount,
    });
  });

  return router;
};
