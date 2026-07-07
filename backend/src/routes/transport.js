/**
 * routes/transport.js
 * Transport info and AI-powered recommendations for stadium travel.
 */

'use strict';

const express  = require('express');
const { chat } = require('../services/openaiService');
const { getStadium } = require('../data/stadiums');
const { requireFields } = require('../middleware/validate');
const { asyncHandler }  = require('../middleware/errorHandler');
const { DEFAULTS, AI_PARAMS } = require('../constants');

const router = express.Router();

/**
 * GET /api/transport/:stadiumId
 * Returns all available transport modes for a stadium.
 */
router.get('/:stadiumId', (req, res) => {
  const stadium = getStadium(req.params.stadiumId); // O(1) Map lookup
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
  res.json({ stadium: stadium.name, city: stadium.city, transport: stadium.transportation });
});

/**
 * POST /api/transport/recommend
 * Returns an AI-powered (or fallback) personalised transport recommendation.
 *
 * @body {string}  stadiumId      - Destination stadium (required)
 * @body {string}  origin         - Fan's starting location (required)
 * @body {string}  [arrivalTime]  - Desired arrival time
 * @body {number}  [groupSize]    - Number of travellers (default 1)
 * @body {boolean} [accessibility] - Whether accessible options are needed
 * @body {string}  [language]     - Response language (default English)
 */
router.post(
  '/recommend',
  requireFields(['stadiumId', 'origin']),
  asyncHandler(async (req, res) => {
    const {
      stadiumId,
      origin,
      arrivalTime,
      groupSize    = DEFAULTS.GROUP_SIZE,
      accessibility = false,
      language     = DEFAULTS.LANGUAGE,
    } = req.body;

    const stadium = getStadium(stadiumId); // O(1)
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const t = stadium.transportation;

    const recommendation = await chat(
      'You are a smart transport advisor for FIFA World Cup 2026. Promote sustainable travel. Be practical and specific.',
      `Fan needs transport to ${stadium.name} in ${stadium.city}.\n` +
      `Origin: ${origin}\n` +
      `Desired arrival: ${arrivalTime || 'match time'}\n` +
      `Group size: ${groupSize}\n` +
      `Accessibility needs: ${accessibility ? 'Yes (wheelchair/mobility)' : 'None'}\n` +
      `Options: ${JSON.stringify(t)}\n\n` +
      `Recommend the best option. Include: name, estimated time, sustainability score (1-5 stars), tips.\n` +
      `Respond in ${language}.`,
      AI_PARAMS.TRANSPORT
    );

    if (recommendation) return res.json({ recommendation, stadium: stadium.name, origin });

    // Smart-engine fallback — variables computed once, not repeated
    const subwayLine  = Array.isArray(t.subway) && t.subway.length > 0 ? t.subway[0] : t.subway;
    const busLine     = Array.isArray(t.bus) && t.bus.length > 0 ? t.bus[0] : t.bus;
    const parkingInfo = Array.isArray(t.parking) ? t.parking.join(', ') : t.parking;
    const groupTip    = groupSize > 3
      ? 'For your group, consider splitting between rideshare vehicles'
      : 'Public transit is best for speed and sustainability';
    const accessNote  = accessibility
      ? '\n♿ All recommended options are wheelchair accessible.' : '';

    res.json({
      recommendation:
        `🚌 Transport to ${stadium.name}\n\n` +
        `From: ${origin} | Arrival: ${arrivalTime || 'Match time'} | Group: ${groupSize}\n\n` +
        `🏆 Top Pick: Public Transit ⭐⭐⭐⭐⭐\n• ${subwayLine}\n• 🌿 Most eco-friendly\n\n` +
        `🚌 Bus ⭐⭐⭐⭐\n• ${busLine}\n\n` +
        `🚗 Driving: ${parkingInfo} | ${t.rideshare}\n\n` +
        `💡 Arrive 2h before kick-off. ${groupTip}. Post-match: 60-90 min congestion.` + accessNote,
      stadium: stadium.name, origin, source: 'smart-engine',
    });
  })
);

module.exports = router;
