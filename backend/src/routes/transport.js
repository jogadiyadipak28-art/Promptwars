const express = require('express');
const router = express.Router();
const { chat } = require('../services/openaiService');
const { STADIUMS } = require('../data/stadiums');

// Get transport options for a stadium
router.get('/:stadiumId', (req, res) => {
  const stadium = STADIUMS.find(s => s.id === req.params.stadiumId);
  if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
  res.json({ stadium: stadium.name, city: stadium.city, transport: stadium.transportation });
});

// AI-powered transport recommendation
router.post('/recommend', async (req, res) => {
  try {
    const { stadiumId, origin, arrivalTime, groupSize = 1, accessibility = false, language = 'English' } = req.body;
    if (!stadiumId || !origin) return res.status(400).json({ error: 'stadiumId and origin are required' });

    const stadium = STADIUMS.find(s => s.id === stadiumId);
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const prompt = `Fan needs transport to ${stadium.name} in ${stadium.city}.
Origin: ${origin}
Desired arrival: ${arrivalTime || 'match time'}
Group size: ${groupSize}
Accessibility needs: ${accessibility ? 'Yes (wheelchair/mobility)' : 'None'}
Available options: ${JSON.stringify(stadium.transportation)}

Recommend the best transport option considering: cost-efficiency, sustainability, crowd avoidance, group size.
Include: option name, estimated time, sustainability score (1-5 stars), tips.
Respond in ${language}.`;

    const recommendation = await chat(
      'You are a smart transport advisor for FIFA World Cup 2026. Promote sustainable travel options. Be practical and specific.',
      prompt,
      { temperature: 0.5, max_tokens: 300 }
    );

    if (recommendation) {
      res.json({ recommendation, stadium: stadium.name, origin });
    } else {
      // Fallback transport recommendation
      const t = stadium.transportation;
      const accessNote = accessibility
        ? '\n♿ **Accessibility:** All recommended transport options are wheelchair accessible. Rideshare drivers can be requested with accessible vehicles.'
        : '';

      const fallback = `🚌 Transport Recommendation to ${stadium.name}\n\n` +
        `**From:** ${origin}\n` +
        `**Arrival target:** ${arrivalTime || 'Match time'}\n` +
        `**Group size:** ${groupSize}\n\n` +
        `**🏆 Top Recommendation: Public Transit** ⭐⭐⭐⭐⭐\n` +
        `• ${Array.isArray(t.subway) ? t.subway[0] : t.subway}\n` +
        `• Estimated travel time: 30-60 min (varies by origin)\n` +
        `• 🌿 Most eco-friendly option\n\n` +
        `**🚌 Alternative: Bus** ⭐⭐⭐⭐\n` +
        `• ${Array.isArray(t.bus) ? t.bus[0] : t.bus}\n\n` +
        `**🚗 If driving:** ${Array.isArray(t.parking) ? t.parking.join(', ') : t.parking}\n` +
        `• ${t.rideshare}\n\n` +
        `💡 **Tips:**\n` +
        `• Arrive 2 hours before kick-off to avoid peak congestion\n` +
        `• ${groupSize > 3 ? 'For your group size, consider splitting between rideshare vehicles' : 'Public transit is your best bet for speed and sustainability'}\n` +
        `• Post-match: expect 60-90 min road congestion` +
        accessNote;
      res.json({ recommendation: fallback, stadium: stadium.name, origin, source: 'smart-engine' });
    }
  } catch (err) {
    console.error('transport recommend error:', err.message);
    res.status(500).json({ error: 'Transport recommendation unavailable' });
  }
});

module.exports = router;
