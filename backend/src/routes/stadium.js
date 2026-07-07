const express = require('express');
const router  = express.Router();
const { STADIUMS, MATCHES, getStadium, getMatchesForStadium } = require('../data/stadiums');

// GET /api/stadium — all stadiums
router.get('/', (_req, res) => res.json(STADIUMS));

// GET /api/stadium/matches/all — must be before /:id to avoid param conflict
router.get('/matches/all', (_req, res) => res.json(MATCHES));

// GET /api/stadium/:id
router.get('/:id', (req, res) => {
  const stadium = getStadium(req.params.id); // O(1) Map lookup
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
  res.json(stadium);
});

// GET /api/stadium/:id/matches
router.get('/:id/matches', (req, res) => {
  const stadium = getStadium(req.params.id); // validate id exists
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
  res.json(getMatchesForStadium(req.params.id)); // O(1) pre-grouped lookup
});

module.exports = router;
