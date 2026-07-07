const express = require('express');
const router = express.Router();
const { CROWD_DATA, STADIUMS } = require('../data/stadiums');

// Get crowd data for all stadiums
router.get('/', (req, res) => {
  const enriched = Object.entries(CROWD_DATA).map(([id, data]) => {
    const stadium = STADIUMS.find(s => s.id === id);
    return {
      id,
      name: stadium?.name,
      city: stadium?.city,
      occupancyPct: Math.round((data.currentOccupancy / data.capacity) * 100),
      ...data
    };
  });
  res.json(enriched);
});

// Get crowd data for a specific stadium
router.get('/:stadiumId', (req, res) => {
  const data = CROWD_DATA[req.params.stadiumId];
  if (!data) return res.status(404).json({ error: 'Stadium not found' });
  const stadium = STADIUMS.find(s => s.id === req.params.stadiumId);
  res.json({
    id: req.params.stadiumId,
    name: stadium?.name,
    occupancyPct: Math.round((data.currentOccupancy / data.capacity) * 100),
    ...data
  });
});

module.exports = router;
