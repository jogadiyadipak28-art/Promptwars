const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const julepService = require('../services/julepService');
const { STADIUMS, CROWD_DATA } = require('../data/stadiums');

/**
 * POST /api/chatbot/message
 * Body: { message, sessionId?, stadiumId?, language? }
 * Returns: { reply, sessionId }
 */
router.post('/message', async (req, res) => {
  try {
    const {
      message,
      stadiumId,
      language = 'English',
      sessionId = uuidv4()
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Build context hint with live stadium data
    const stadium = STADIUMS.find(s => s.id === stadiumId);
    const crowd = stadiumId ? CROWD_DATA[stadiumId] : null;
    const occupancyPct = crowd
      ? Math.round((crowd.currentOccupancy / crowd.capacity) * 100)
      : null;

    const contextHint = stadium
      ? `You are assisting a fan at ${stadium.name} in ${stadium.city}.
Stadium capacity: ${stadium.capacity.toLocaleString()} | Current occupancy: ${occupancyPct}%
Gates: ${stadium.gates.join(', ')}
Accessible entrances: ${stadium.facilities.accessibleEntrances.join(', ')}
Medical stations: ${stadium.facilities.medicalStations.join(', ')}
Family zones: ${stadium.facilities.familyZones.join(', ')}
Prayer rooms: ${stadium.facilities.prayerRooms.join(', ')}
Congested areas right now: ${crowd?.hotspots?.join(', ') || 'none reported'}
Gate wait times: ${crowd ? Object.entries(crowd.waitTimes).map(([g, t]) => `${g} ${t}min`).join(', ') : 'unavailable'}
Transport: ${JSON.stringify(stadium.transportation)}
Respond in ${language}. Be concise (2-4 sentences max).`
      : `You are the official FIFA World Cup 2026 AI assistant. Respond in ${language}.`;

    // Prepend language instruction to the message if not English
    const enrichedMessage = language !== 'English'
      ? `[Please respond in ${language}] ${message}`
      : message;

    // Embed stadiumId so the service can resolve stadium data
    const fullContext = stadiumId
      ? `stadium_id:${stadiumId}\n${contextHint}`
      : contextHint;

    const reply = await julepService.chat(sessionId, enrichedMessage, fullContext);

    res.json({ reply, sessionId });
  } catch (err) {
    console.error('[Chatbot] Error:', err.message);

    // Graceful degradation with a helpful fallback
    res.status(500).json({
      error: 'Chatbot temporarily unavailable',
      details: err.message,
      reply: "I'm having a moment — please try again shortly! ⚽"
    });
  }
});

/**
 * POST /api/chatbot/reset
 * Body: { sessionId }
 * Clears session memory so the conversation starts fresh.
 */
router.post('/reset', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await julepService.deleteSession(sessionId);
    }
    res.json({ success: true, message: 'Session cleared' });
  } catch (err) {
    console.error('[Chatbot] Reset error:', err.message);
    res.json({ success: false });
  }
});

/**
 * GET /api/chatbot/status
 * Checks if Julep is reachable and returns agent info.
 */
router.get('/status', async (req, res) => {
  try {
    const agentId = await julepService.getAgent();
    res.json({ online: true, agentId, provider: 'Julep AI', model: 'claude-3-5-sonnet' });
  } catch (err) {
    console.error('[Chatbot] Status error:', err.message);
    res.status(503).json({ online: false, error: err.message });
  }
});

module.exports = router;
