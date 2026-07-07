/**
 * routes/chatbot.js
 *
 * Julep AI / smart-engine chatbot endpoints.
 * Provides persistent conversational sessions for FIFA World Cup 2026 fans.
 */

'use strict';

const express      = require('express');
const { v4: uuidv4 } = require('uuid');

const julepService              = require('../services/julepService');
const { CROWD_DATA, getStadium, calcOccupancy } = require('../data/stadiums');
const { requireFields }         = require('../middleware/validate');
const { asyncHandler }          = require('../middleware/errorHandler');
const { DEFAULTS }              = require('../constants');

const router = express.Router();

/**
 * POST /api/chatbot/message
 *
 * @body {string}  message    - User message (required)
 * @body {string}  [sessionId]  - Existing session ID; a new UUID is created if omitted
 * @body {string}  [stadiumId]  - Stadium context for personalised responses
 * @body {string}  [language]   - Response language (default: English)
 *
 * @returns {{ reply: string, sessionId: string }}
 */
router.post(
  '/message',
  requireFields(['message']),
  asyncHandler(async (req, res) => {
    const {
      message,
      stadiumId,
      language  = DEFAULTS.LANGUAGE,
      sessionId = uuidv4(),
    } = req.body;

    // Resolve stadium context — O(1) Map lookup
    const stadium      = stadiumId ? getStadium(stadiumId) : null;
    const crowd        = stadiumId ? CROWD_DATA[stadiumId] : null;
    const occupancyPct = crowd ? calcOccupancy(crowd) : null;

    const facilities = stadium?.facilities || {};
    const contextHint = stadium
      ? `You are assisting a fan at ${stadium.name} in ${stadium.city}.\n` +
        `Stadium capacity: ${stadium.capacity.toLocaleString()} | Current occupancy: ${occupancyPct}%\n` +
        `Gates: ${(stadium.gates || []).join(', ')}\n` +
        `Accessible entrances: ${(facilities.accessibleEntrances || []).join(', ')}\n` +
        `Medical stations: ${(facilities.medicalStations || []).join(', ')}\n` +
        `Family zones: ${(facilities.familyZones || []).join(', ')}\n` +
        `Prayer rooms: ${(facilities.prayerRooms || []).join(', ')}\n` +
        `Congested areas: ${crowd?.hotspots?.join(', ') || 'none reported'}\n` +
        `Gate wait times: ${crowd ? Object.entries(crowd.waitTimes || {}).map(([g, t]) => `${g} ${t}min`).join(', ') : 'unavailable'}\n` +
        `Transport: ${JSON.stringify(stadium.transportation)}\n` +
        `Respond in ${language}. Be concise (2-4 sentences max).`
      : `You are the official FIFA World Cup 2026 AI assistant. Respond in ${language}.`;

    // Prepend language directive for non-English requests
    const enrichedMessage = language !== DEFAULTS.LANGUAGE
      ? `[Please respond in ${language}] ${message}`
      : message;

    // Embed stadiumId so the service can resolve context internally
    const fullContext = stadiumId ? `stadium_id:${stadiumId}\n${contextHint}` : contextHint;

    const reply = await julepService.chat(sessionId, enrichedMessage, fullContext);

    res.json({ reply, sessionId });
  })
);

/**
 * POST /api/chatbot/reset
 *
 * Clears the session memory so the conversation starts fresh.
 *
 * @body {string} sessionId - Session to clear
 * @returns {{ success: boolean, message?: string }}
 */
router.post(
  '/reset',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) {
      await julepService.deleteSession(sessionId);
    }
    res.json({ success: true, message: 'Session cleared' });
  })
);

/**
 * GET /api/chatbot/status
 *
 * Reports whether the AI backend is reachable.
 *
 * @returns {{ online: boolean, agentId: string, provider: string }}
 */
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const agentId = await julepService.getAgent();
    res.json({ online: true, agentId, provider: 'Julep AI / StadiumAI Engine' });
  })
);

module.exports = router;
