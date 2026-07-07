/**
 * middleware/validate.js
 *
 * Reusable Express middleware factories for request validation.
 * Keeps route handlers clean — no inline validation logic.
 *
 * Usage:
 *   router.post('/route', requireFields(['field1', 'field2']), handler);
 *   router.post('/route', requireStadium, handler);
 */

'use strict';

const { getStadium } = require('../data/stadiums');

/**
 * Middleware factory — returns 400 if any of the listed body fields are missing/empty.
 *
 * @param {string[]} fields - Required body field names.
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/translate', requireFields(['text', 'targetLanguage']), handler);
 */
function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f];
      return val === undefined || val === null || val === '';
    });
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Middleware — resolves stadiumId from req.body and attaches the stadium object
 * to req.stadium. Returns 404 if the stadium does not exist.
 *
 * Requires req.body.stadiumId to be set before this middleware runs.
 *
 * @type {import('express').RequestHandler}
 */
function requireStadium(req, res, next) {
  const { stadiumId } = req.body;
  if (!stadiumId) return res.status(400).json({ error: 'stadiumId is required' });

  const stadium = getStadium(stadiumId); // O(1) Map lookup
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

  req.stadium = stadium; // attach for downstream use
  next();
}

/**
 * Middleware — same as requireStadium but treats missing stadiumId as optional.
 * Attaches req.stadium if found, otherwise req.stadium = null.
 *
 * @type {import('express').RequestHandler}
 */
function optionalStadium(req, res, next) {
  const { stadiumId } = req.body;
  req.stadium = stadiumId ? (getStadium(stadiumId) || null) : null;
  next();
}

/**
 * Middleware — sanitizes conversationHistory from req.body:
 * - Ensures it is an array
 * - Strips any fields other than 'role' and 'content'
 * - Caps length to prevent prompt injection via oversized history
 *
 * @param {number} [maxTurns=10] - Maximum number of history entries to keep.
 * @returns {import('express').RequestHandler}
 */
function sanitizeHistory(maxTurns = 10) {
  return (req, _res, next) => {
    const raw = req.body.conversationHistory;
    if (!Array.isArray(raw)) {
      req.body.conversationHistory = [];
      return next();
    }
    req.body.conversationHistory = raw
      .slice(-maxTurns)
      .filter(m => m && typeof m === 'object')
      .map(({ role, content }) => ({
        role:    String(role    || 'user').slice(0, 20),
        content: String(content || '').slice(0, 2000), // cap per-message size
      }));
    next();
  };
}

module.exports = { requireFields, requireStadium, optionalStadium, sanitizeHistory };
