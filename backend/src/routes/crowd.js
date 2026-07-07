/**
 * routes/crowd.js
 * Real-time crowd occupancy and gate wait-time data for all stadiums.
 */

'use strict';

const express = require('express');
const { CROWD_DATA, getStadium, calcOccupancy } = require('../data/stadiums');

const router = express.Router();

/**
 * GET /api/crowd
 * Returns occupancy data for every stadium, enriched with name/city and a
 * pre-calculated occupancyPct so clients don't have to compute it.
 */
router.get('/', (_req, res) => {
  const enriched = Object.entries(CROWD_DATA).map(([id, data]) => {
    const stadium = getStadium(id); // O(1) Map lookup
    return {
      id,
      name:         stadium?.name,
      city:         stadium?.city,
      occupancyPct: calcOccupancy(data),
      ...data,
    };
  });
  res.json(enriched);
});

/**
 * GET /api/crowd/:stadiumId
 * Returns crowd data for a single stadium.
 *
 * @param {string} stadiumId - Stadium ID (e.g. 'metlife', 'azteca')
 */
router.get('/:stadiumId', (req, res) => {
  const data = CROWD_DATA[req.params.stadiumId];
  if (!data) return res.status(404).json({ error: 'Stadium not found' });

  const stadium = getStadium(req.params.stadiumId); // O(1)
  res.json({
    id:           req.params.stadiumId,
    name:         stadium?.name,
    occupancyPct: calcOccupancy(data),
    ...data,
  });
});

module.exports = router;
