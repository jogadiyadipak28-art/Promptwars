const express = require('express');
const router = express.Router();
const { STADIUMS, MATCHES } = require('../data/stadiums');

router.get('/', (req, res) => res.json(STADIUMS));

router.get('/:id', (req, res) => {
  const stadium = STADIUMS.find(s => s.id === req.params.id);
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
  res.json(stadium);
});

router.get('/:id/matches', (req, res) => {
  const matches = MATCHES.filter(m => m.stadium === req.params.id);
  res.json(matches);
});

router.get('/matches/all', (req, res) => res.json(MATCHES));

module.exports = router;
