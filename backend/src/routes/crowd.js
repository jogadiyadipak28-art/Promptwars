const express = require('express');
const router  = express.Router();
const { CROWD_DATA, getStadium, calcOccupancy } = require('../data/stadiums');

// GET /api/crowd — all stadiums enriched with occupancy %
router.get('/', (_req, res) => {
  const enriched = Object.entries(CROWD_DATA).map(([id, data]) => {
    const stadium = getStadium(id); // O(1) Map lookup
    return {
      id,
      name:         stadium?.name,
      city:         stadium?.city,
      occupancyPct: calcOccupancy(data), // shared utility — no inline formula
      ...data,
    };
  });
  res.json(enriched);
});

// GET /api/crowd/:stadiumId
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
