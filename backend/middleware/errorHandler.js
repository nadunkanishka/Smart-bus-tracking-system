// The one error path for the REST API. Express 5 forwards a rejected async handler here, so route handlers do not
// catch errors themselves. The response is always { error: message } (see describeError in lib/crud.js).
const { describeError } = require('../lib/crud');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Request-parsing errors (bad JSON, body too large) keep Express's own answer, as before.
  if (res.headersSent || err.type) return next(err);
  const { status, error } = describeError(err);
  return res.status(status).json({ error });
};
