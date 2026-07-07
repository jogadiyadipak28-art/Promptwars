/**
 * routes/ai.js
 *
 * AI-powered endpoints for the FIFA World Cup 2026 StadiumAI platform.
 * Each route tries the OpenAI service first and falls back to the built-in
 * smart rule-based engine when AI is unavailable.
 */

'use strict';

const express = require('express');

const { chat, chatWithHistory }                             = require('../services/openaiService');
const { smartRespond }                                      = require('../services/julepService');
const { CROWD_DATA, getStadium, calcOccupancy, fastestAndSlowestGate } = require('../data/stadiums');
const { requireFields, requireStadium, optionalStadium, sanitizeHistory } = require('../middleware/validate');
const { asyncHandler }                                      = require('../middleware/errorHandler');
const {
  DEFAULTS, AI_PARAMS, SEVERITY, MAX_HISTORY_TURNS,
  OCCUPANCY_THRESHOLDS, getAnalysisRiskLabel, getVolunteerRiskLevel,
} = require('../constants');

const router = express.Router();

// ─── Helper: build stadium context string for AI prompts ─────────────────────
/**
 * @param {object} stadium
 * @param {object|null} crowd
 * @param {number|null} occupancyPct
 * @param {string} language
 * @returns {string}
 */
function buildStadiumContext(stadium, crowd, occupancyPct, language) {
  if (!stadium) return '';
  const facilities = stadium.facilities || {};
  return (
    `Current Stadium: ${stadium.name}, ${stadium.city}\n` +
    `Capacity: ${stadium.capacity.toLocaleString()} | Current Occupancy: ${occupancyPct}%\n` +
    `Gates: ${(stadium.gates || []).join(', ')}\n` +
    `Accessible Entrances: ${(facilities.accessibleEntrances || []).join(', ')}\n` +
    `Medical Stations: ${(facilities.medicalStations || []).join(', ')}\n` +
    `Family Zones: ${(facilities.familyZones || []).join(', ')}\n` +
    `Prayer Rooms: ${(facilities.prayerRooms || []).join(', ')}\n` +
    `Transport: ${JSON.stringify(stadium.transportation)}\n` +
    (crowd ? `Hot Spots (congested areas): ${(crowd.hotspots || []).join(', ')}\n` : '') +
    `\nAlways respond in ${language}.`
  );
}

// ─── FAN ASSISTANT ────────────────────────────────────────────────────────────
router.post(
  '/fan-assistant',
  requireFields(['message']),
  optionalStadium,
  sanitizeHistory(MAX_HISTORY_TURNS),
  asyncHandler(async (req, res) => {
    const { message, language = DEFAULTS.LANGUAGE, conversationHistory } = req.body;
    const stadium      = req.stadium;
    const crowd        = stadium ? CROWD_DATA[stadium.id] : null;
    const occupancyPct = crowd ? calcOccupancy(crowd) : null;

    const systemPrompt =
      `You are StadiumAI, the official AI assistant for FIFA World Cup 2026.\n` +
      `You are knowledgeable, friendly, and concise.\n\n` +
      buildStadiumContext(stadium, crowd, occupancyPct, language) +
      `\nBe concise (max 3-4 sentences). Use emojis sparingly.`;

    const reply = await chatWithHistory(
      systemPrompt,
      [...conversationHistory, { role: 'user', content: message }],
      AI_PARAMS.FAN_ASSISTANT
    );

    if (reply) return res.json({ reply, language, stadium: stadium?.name || null });

    res.json({
      reply:   smartRespond(message, stadium, crowd),
      language,
      stadium: stadium?.name || null,
      source:  'smart-engine',
    });
  })
);

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
router.post(
  '/navigate',
  requireFields(['from', 'to', 'stadiumId']),
  requireStadium,
  asyncHandler(async (req, res) => {
    const { from, to, accessibility = false, language = DEFAULTS.LANGUAGE } = req.body;
    const stadium  = req.stadium;
    const hotspots = CROWD_DATA[stadium.id]?.hotspots || [];

    const prompt =
      `Generate step-by-step navigation inside ${stadium.name} from "${from}" to "${to}".\n` +
      `Layout: Gates ${stadium.gates.join(', ')}, Sections: Lower ${stadium.sections.lower}, ` +
      `Club ${stadium.sections.club}, Upper ${stadium.sections.upper}.\n` +
      `Congestion hotspots to avoid: ${hotspots.join(', ') || 'none'}.\n` +
      (accessibility ? 'Wheelchair route — use lifts, not stairs.\n' : '') +
      `Respond in ${language}. Use numbered steps. Include estimated walking time.`;

    const instructions = await chat(
      'You are an expert indoor navigation system for FIFA World Cup 2026 stadiums.',
      prompt,
      AI_PARAMS.NAVIGATION
    );

    if (instructions) return res.json({ instructions, from, to, stadiumId: stadium.id, accessibility, language });

    const avoidNote  = hotspots.length ? `\n⚠️ Avoid: ${hotspots.join(', ')}` : '';
    const accessNote = accessibility ? '\n♿ Use accessible entrances and lifts.' : '';
    const gates = stadium.gates || [];
    const gateText = gates.length >= 2 ? `${gates[0]} or ${gates[1]}` : gates.length === 1 ? gates[0] : 'the nearest gate';

    res.json({
      instructions:
        `🗺️ Directions from "${from}" to "${to}" at ${stadium.name}:\n\n` +
        `1. Enter through ${gateText}\n` +
        `2. Follow concourse signs toward your destination\n` +
        `3. Blue signage = facilities, green = exits\n` +
        `4. Staff in red vests can assist\n\n` +
        `⏱️ Estimated walking time: 3-7 minutes` + avoidNote + accessNote,
      from, to, stadiumId: stadium.id, accessibility, language, source: 'smart-engine',
    });
  })
);

// ─── CROWD INTELLIGENCE ───────────────────────────────────────────────────────
router.post(
  '/crowd-analysis',
  requireFields(['stadiumId']),
  requireStadium,
  asyncHandler(async (req, res) => {
    const stadium      = req.stadium;
    const crowd        = CROWD_DATA[stadium.id];
    const occupancyPct = calcOccupancy(crowd);
    const { fast: fastGate, slow: slowGate } = fastestAndSlowestGate(crowd.waitTimes || {});

    const waitTimesStr = Object.entries(crowd.waitTimes || {})
      .map(([gate, mins]) => `${gate}: ${mins} min`)
      .join(', ');

    const hotspotsList = (crowd.hotspots || []).join(', ');

    const analysis = await chat(
      'You are an AI crowd safety analyst for FIFA World Cup 2026. Provide data-driven, actionable intelligence.',
      `Analyze crowd at ${stadium.name}:\n` +
      `- Occupancy: ${crowd.currentOccupancy.toLocaleString()} / ${crowd.capacity.toLocaleString()} (${occupancyPct}%)\n` +
      `- Hotspots: ${hotspotsList}\n` +
      `- Wait times: ${waitTimesStr}\n\n` +
      `Provide: 1. Risk level  2. Top 3 staff recommendations  3. Fan advisory  4. 30-min outlook`,
      AI_PARAMS.CROWD_ANALYSIS
    );

    if (analysis) return res.json({ analysis, crowdData: crowd, occupancyPct, stadium: stadium.name });

    const riskLevel = getAnalysisRiskLabel(occupancyPct);

    const fastGateName = fastGate ? fastGate[0] : 'Unknown';
    const fastGateTime = fastGate ? fastGate[1] : 0;
    const slowGateName = slowGate ? slowGate[0] : 'Unknown';
    const slowGateTime = slowGate ? slowGate[1] : 0;
    const primaryHotspot = (crowd.hotspots || [])[0] || 'congested zones';

    res.json({
      analysis:
        `📊 Crowd Analysis — ${stadium.name}\n\n` +
        `**Risk Level:** ${riskLevel}\n\n` +
        `**Status:** Occupancy ${occupancyPct}% | Congested: ${hotspotsList}\n\n` +
        `**Recommendations:**\n` +
        `1. Direct fans to ${fastGateName} (${fastGateTime} min — fastest)\n` +
        `2. Avoid ${slowGateName} (${slowGateTime} min — slowest)\n` +
        `3. ${occupancyPct >= OCCUPANCY_THRESHOLDS.ANALYSIS_HIGH ? 'Deploy extra staff to congested zones' : 'Monitor — no action required'}\n\n` +
        `**Fan Advisory:** Use ${fastGateName}. Avoid ${primaryHotspot}.`,
      crowdData: crowd, occupancyPct, stadium: stadium.name, source: 'smart-engine',
    });
  })
);

// ─── TRANSLATION ──────────────────────────────────────────────────────────────
router.post(
  '/translate',
  requireFields(['text', 'targetLanguage']),
  asyncHandler(async (req, res) => {
    const { text, targetLanguage } = req.body;

    const translated = await chat(
      `You are a professional translator for FIFA World Cup 2026.\n` +
      `Translate accurately and naturally. Preserve tone. Return ONLY the translated text.`,
      `Translate to ${targetLanguage}: "${text}"`,
      AI_PARAMS.TRANSLATION
    );

    if (translated) return res.json({ original: text, translated, targetLanguage });

    res.json({
      original:   text,
      translated: `[${targetLanguage}] ${text}\n\n(⚠️ AI translation unavailable. Ask a multilingual volunteer.)`,
      targetLanguage,
      source: 'fallback',
    });
  })
);

// ─── SUSTAINABILITY ───────────────────────────────────────────────────────────
router.post(
  '/sustainability',
  asyncHandler(async (req, res) => {
    const { stadiumId, query } = req.body;
    // Use provided stadium or fall back to default — both O(1)
    const stadium = (stadiumId ? getStadium(stadiumId) : null) || getStadium(DEFAULTS.STADIUM_ID);

    const advice = await chat(
      `You are a sustainability advisor for FIFA World Cup 2026.\n` +
      `Encourage eco-friendly choices. Keep response under 150 words.`,
      `Fan query at ${stadium.name}: "${query || 'What are the green initiatives here?'}"\n` +
      `Transport: ${JSON.stringify(stadium.transportation)}`,
      AI_PARAMS.SUSTAINABILITY
    );

    if (advice) return res.json({ advice, stadium: stadium.name });

    const subwayLine = Array.isArray(stadium.transportation.subway)
      ? stadium.transportation.subway[0]
      : stadium.transportation.subway;

    res.json({
      advice:
        `🌿 Sustainability at ${stadium.name}:\n\n` +
        `♻️ Recycling bins at every exit — blue = recyclables, green = compost, black = landfill.\n\n` +
        `🚇 Public transit saves ~2.8kg CO₂ vs driving. Take: ${subwayLine}\n\n` +
        `💧 Free water refill stations on every level.\n\n` +
        `🥗 Plant-based options (🌱) have 60% lower carbon footprint.\n\n` +
        `🎯 FIFA WC 2026 Goal: 80% waste diversion — every fan counts!`,
      stadium: stadium.name, source: 'smart-engine',
    });
  })
);

// ─── ALERT GENERATOR ──────────────────────────────────────────────────────────

/** Severity → display config */
const SEVERITY_CONFIG = Object.freeze({
  [SEVERITY.HIGH]:   { emoji: '🔴', guidance: 'Please follow staff directions immediately. Remain calm and proceed to the nearest exit if instructed.' },
  [SEVERITY.MEDIUM]: { emoji: '🟡', guidance: 'Please be aware and follow any staff instructions. Your safety is our priority.' },
  [SEVERITY.LOW]:    { emoji: 'ℹ️',  guidance: 'This is an informational update. No immediate action required.' },
});

router.post(
  '/generate-alert',
  requireFields(['situation']),
  optionalStadium,
  asyncHandler(async (req, res) => {
    const { situation, severity = DEFAULTS.SEVERITY, language = DEFAULTS.LANGUAGE } = req.body;
    const location = req.stadium ? req.stadium.name : 'FIFA World Cup 2026 venue';

    const alert = await chat(
      `You are the official PA system for FIFA World Cup 2026.\n` +
      `Generate clear, calm announcements. Under 60 words. No panic language.`,
      `Generate a ${severity}-severity announcement for ${location}.\nSituation: ${situation}. Language: ${language}.`,
      AI_PARAMS.ALERT
    );

    if (alert) return res.json({ alert, severity, location, language });

    const { emoji, guidance } = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG[SEVERITY.MEDIUM];

    res.json({
      alert:
        `${emoji} ATTENTION — ${location}\n\n` +
        `${severity === SEVERITY.HIGH ? '⚠️ URGENT: ' : ''}${situation}\n\n` +
        `${guidance}\n\nThank you for your cooperation. — ${location} Operations`,
      severity, location, language, source: 'smart-engine',
    });
  })
);

// ─── VOLUNTEER BRIEFING ───────────────────────────────────────────────────────
router.post(
  '/volunteer-brief',
  requireFields(['role', 'stadiumId']),
  requireStadium,
  asyncHandler(async (req, res) => {
    const { role, shiftTime = DEFAULTS.SHIFT_TIME, language = DEFAULTS.LANGUAGE } = req.body;
    const stadium      = req.stadium;
    const crowd        = CROWD_DATA[stadium.id];
    const occupancyPct = calcOccupancy(crowd);

    const facilities = stadium.facilities || {};
    const brief = await chat(
      `You are a volunteer coordinator for FIFA World Cup 2026.\n` +
      `Write concise role-specific shift briefings. Clear sections. Under 200 words.`,
      `Briefing in ${language} for:\nRole: ${role}\nStadium: ${stadium.name}, ${stadium.city}\n` +
      `Shift: ${shiftTime}\nOccupancy: ${occupancyPct}%\n` +
      `Congestion: ${(crowd.hotspots || []).join(', ')}\n` +
      `Accessible entrances: ${(facilities.accessibleEntrances || []).join(', ')}`,
      AI_PARAMS.VOLUNTEER
    );

    if (brief) return res.json({ brief, role, stadium: stadium.name, shiftTime });

    const riskLevel = getVolunteerRiskLevel(occupancyPct);

    res.json({
      brief:
        `📋 SHIFT BRIEFING — ${stadium.name}\n\n` +
        `Role: ${role} | Shift: ${shiftTime} | Location: ${stadium.name}, ${stadium.city}\n\n` +
        `Current Conditions: Occupancy ${occupancyPct}% (${riskLevel}) | Congestion: ${(crowd.hotspots || []).join(', ')}\n\n` +
        `Key Responsibilities:\n` +
        `1. Assist fans with wayfinding and ticket scanning\n` +
        `2. Monitor your zone for safety concerns\n` +
        `3. Direct fans to accessible entrances: ${(facilities.accessibleEntrances || []).join(', ')}\n` +
        `4. Report incidents to control room immediately\n\n` +
        `Priority: ${occupancyPct >= OCCUPANCY_THRESHOLDS.ANALYSIS_HIGH ? 'High crowd density — extra vigilance required' : 'Normal operations'}\n` +
        `Medical stations: ${(facilities.medicalStations || []).join(', ')}\n\n` +
        `Stay hydrated. Radio check every 30 minutes. Thank you! ⚽`,
      role, stadium: stadium.name, shiftTime, source: 'smart-engine',
    });
  })
);

module.exports = router;
