/**
 * middleware/errorHandler.js
 *
 * Centralised error-handling helpers.
 *
 * - asyncHandler  : wraps async route handlers so thrown errors reach Express
 * - globalError   : Express 4-arg error middleware for unhandled route errors
 * - notFound      : 404 catch-all middleware
 */

'use strict';

/**
 * Wraps an async route handler and forwards any thrown error to next().
 * Eliminates the need for try/catch boilerplate in every handler.
 *
 * @param {import('express').RequestHandler} fn - Async route handler.
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Express global error handler (must have 4 parameters).
 * Attach after all routes: app.use(globalError).
 *
 * @type {import('express').ErrorRequestHandler}
 */
function globalError(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  if (status >= 500) console.error('[Server Error]', err.stack || err.message);
  res.status(status).json({ error: message });
}

/**
 * 404 catch-all — attach before globalError, after all routes.
 *
 * @type {import('express').RequestHandler}
 */
function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

module.exports = { asyncHandler, globalError, notFound };
