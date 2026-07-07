const express = require('express');
const router  = express.Router();
const { chat } = require('../services/openaiService');
const { getStadium } = require('../data/stadiums');

// GET /api/transport/:stadiumId — transport options for a stadium
router.get('/:stadiumId', (req, res) => {
  const stadium = getStadium(req.params.stadiumId); // O(1) Map lookup
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
  res.json({ stadium: stadium.name, city: stadium.city, transport: stadium.transportation });
});

// POST /api/transport/recommend — AI-powered transport recommendation
router.post('/recommend', async (req, res) => {
  try {
    const {
      stadiumId,
      origin,
      arrivalTime,
      groupSize    = 1,
      accessibility = false,
      language     = 'English',
    } = req.body;

    if (!stadiumId || !origin) {
      return res.status(400).json({ error: 'stadiumId and origin are required' });
    }

    const stadium = getStadium(stadiumId); // O(1)
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const t = stadium.transportation;

    const prompt =
      `Fan needs transport to ${stadium.name} in ${stadium.city}.\n` +
      `Origin: ${origin}\n` +
      `Desired arrival: ${arrivalTime || 'match time'}\n` +
      `Group size: ${groupSize}\n` +
      `Accessibility needs: ${accessibility ? 'Yes (wheelchair/mobility)' : 'None'}\n` +
      `Available options: ${JSON.stringify(t)}\n\n` +
      `Recommend the best transport option considering: cost-efficiency, sustainability, crowd avoidance, group size.\n` +
      `Include: option name, estimated time, sustainability score (1-5 stars), tips.\n` +
      `Respond in ${language}.`;

    const recommendation = await chat(
      'You are a smart transport advisor for FIFA World Cup 2026. Promote sustainable travel options. Be practical and specific.',
      prompt,
      { temperature: 0.5, max_tokens: 300 }
    );

    if (recommendation) {
      return res.json({ recommendation, stadium: stadium.name, origin });
    }

    // Smart-engine fallback — build once, no repeated string ops
    const subwayLine  = Array.isArray(t.subway)  ? t.subway[0]  : t.subway;
    const busLine     = Array.isArray(t.bus)      ? t.bus[0]     : t.bus;
    const parkingInfo = Array.isArray(t.parking)  ? t.parking.join(', ') : t.parking;
    const groupTip    = groupSize > 3
      ? 'For your group size, consider splitting between rideshare vehicles'
      : 'Public transit is your best bet for speed and sustainability';
    const accessNote  = accessibility
      ? '\n♿ **Accessibility:** All recommended options are wheelchair accessible.'
      : '';

    const fallback =
      `🚌 Transport Recommendation to ${stadium.name}\n\n` +
      `**From:** ${origin}\n` +
      `**Arrival target:** ${arrivalTime || 'Match time'}\n` +
      `**Group size:** ${groupSize}\n\n` +
      `**🏆 Top Recommendation: Public Transit** ⭐⭐⭐⭐⭐\n` +
      `• ${subwayLine}\n` +
      `• Estimated travel time: 30-60 min (varies by origin)\n` +
      `• 🌿 Most eco-friendly option\n\n` +
      `**🚌 Alternative: Bus** ⭐⭐⭐⭐\n` +
      `• ${busLine}\n\n` +
      `**🚗 If driving:** ${parkingInfo}\n` +
      `• ${t.rideshare}\n\n` +
      `💡 **Tips:**\n` +
      `• Arrive 2 hours before kick-off to avoid peak congestion\n` +
      `• ${groupTip}\n` +
      `• Post-match: expect 60-90 min road congestion` +
      accessNote;

    res.json({ recommendation: fallback, stadium: stadium.name, origin, source: 'smart-engine' });
  } catch (err) {
    console.error('transport recommend error:', err.message);
    res.status(500).json({ error: 'Transport recommendation unavailable' });
  }
});

module.exports = router;
