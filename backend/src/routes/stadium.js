/**
 * routes/stadium.js
 * Stadium data endpoints — list, detail, and match schedule.
 */

'use strict';

const express = require('express');
const { STADIUMS, MATCHES, getStadium, getMatchesForStadium } = require('../data/stadiums');

const router = express.Router();

/**
 * GET /api/stadium
 * Returns the full list of FIFA WC 2026 host stadiums.
 */
router.get('/', (_req, res) => res.json(STADIUMS));

/**
 * GET /api/stadium/matches/all
 * Returns all matches across all stadiums.
 * Must be registered before /:id to prevent 'matches' being treated as an id.
 */
router.get('/matches/all', (_req, res) => res.json(MATCHES));

/**
 * GET /api/stadium/:id
 * Returns a single stadium by its id.
 *
 * @param {string} id - Stadium ID (e.g. 'metlife', 'sofi')
 */
router.get('/:id', (req, res) => {
  const stadium = getStadium(req.params.id); // O(1) Map lookup
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
  res.json(stadium);
});

/**
 * GET /api/stadium/:id/matches
 * Returns all matches scheduled at the given stadium.
 *
 * @param {string} id - Stadium ID
 */
router.get('/:id/matches', (req, res) => {
  if (!getStadium(req.params.id)) {
    return res.status(404).json({ error: 'Stadium not found' });
  }
  res.json(getMatchesForStadium(req.params.id)); // O(1) pre-grouped lookup
});

module.exports = router;
