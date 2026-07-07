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

// Simple in-memory cache for static stadium context strings
const stadiumContextCache = new Map();

// Memoization cache for expensive calculations
const occupancyCache = new Map();
const gateAnalysisCache = new Map();

/**
 * Memoized version of calcOccupancy to avoid repeated calculations
 */
function getCachedOccupancy(crowd) {
  const cacheKey = `${crowd.currentOccupancy}_${crowd.capacity}`;
  if (occupancyCache.has(cacheKey)) {
    return occupancyCache.get(cacheKey);
  }
  const result = calcOccupancy(crowd);
  occupancyCache.set(cacheKey, result);
  return result;
}

/**
 * Memoized version of fastestAndSlowestGate to avoid repeated calculations
 */
function getCachedGateAnalysis(waitTimes) {
  const cacheKey = JSON.stringify(waitTimes);
  if (gateAnalysisCache.has(cacheKey)) {
    return gateAnalysisCache.get(cacheKey);
  }
  const result = fastestAndSlowestGate(waitTimes);
  gateAnalysisCache.set(cacheKey, result);
  return result;
}

const router = express.Router();

// ─── Helper: build stadium context string for AI prompts ─────────────────────
/**
 * Builds a comprehensive context string for AI prompts containing stadium details,
 * crowd information, and operational data. Uses caching for static stadium data.
 *
 * @param {import('../data/stadiums').Stadium} stadium - Stadium object with facilities and transportation
 * @param {import('../data/stadiums').CrowdData|null} crowd - Current crowd data or null
 * @param {number|null} occupancyPct - Occupancy percentage (0-100) or null
 * @param {string} language - Target language for AI responses
 * @returns {string} Formatted context string for AI prompts
 */
function buildStadiumContext(stadium, crowd, occupancyPct, language) {
  if (!stadium) return '';
  
  // Cache key for static stadium data (excludes dynamic crowd data)
  const staticCacheKey = `${stadium.id}_${language}`;
  let staticContext = stadiumContextCache.get(staticCacheKey);
  
  if (!staticContext) {
    const facilities = stadium.facilities || {};
    staticContext =
      `Current Stadium: ${stadium.name}, ${stadium.city}\n` +
      `Capacity: ${stadium.capacity.toLocaleString()}\n` +
      `Gates: ${(stadium.gates || []).join(', ')}\n` +
      `Accessible Entrances: ${(facilities.accessibleEntrances || []).join(', ')}\n` +
      `Medical Stations: ${(facilities.medicalStations || []).join(', ')}\n` +
      `Family Zones: ${(facilities.familyZones || []).join(', ')}\n` +
      `Prayer Rooms: ${(facilities.prayerRooms || []).join(', ')}\n` +
      `Transport: ${JSON.stringify(stadium.transportation)}\n`;
    stadiumContextCache.set(staticCacheKey, staticContext);
  }
  
  // Append dynamic data (occupancy and crowd hotspots)
  return staticContext +
    `Current Occupancy: ${occupancyPct}%\n` +
    (crowd ? `Hot Spots (congested areas): ${(crowd.hotspots || []).join(', ')}\n` : '') +
    `\nAlways respond in ${language}.`;
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
    const occupancyPct = crowd ? getCachedOccupancy(crowd) : null;

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
    const occupancyPct = getCachedOccupancy(crowd);
    const { fast: fastGate, slow: slowGate } = getCachedGateAnalysis(crowd.waitTimes || {});

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
    const occupancyPct = getCachedOccupancy(crowd);

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

// ─── OPERATIONAL INTELLIGENCE ────────────────────────────────────────────────
router.post(
  '/operational-intelligence',
  requireFields(['stadiumId']),
  requireStadium,
  asyncHandler(async (req, res) => {
    const { timeFrame = '1h', focusAreas = ['crowd', 'staffing', 'resources'] } = req.body;
    const stadium = req.stadium;
    const crowd = CROWD_DATA[stadium.id];
    const occupancyPct = getCachedOccupancy(crowd);

    const intelligence = await chat(
      'You are an AI operational intelligence analyst for FIFA World Cup 2026. Provide data-driven insights for stadium operations.',
      `Generate operational intelligence for ${stadium.name}:\n` +
      `- Time frame: ${timeFrame}\n- Current occupancy: ${occupancyPct}%\n` +
      `- Focus areas: ${focusAreas.join(', ')}\n` +
      `- Congestion: ${(crowd.hotspots || []).join(', ')}\n` +
      `- Gate wait times: ${JSON.stringify(crowd.waitTimes || {})}\n\n` +
      `Provide: 1. Predictive insights 2. Resource recommendations 3. Risk assessment 4. Action items`,
      AI_PARAMS.CROWD_ANALYSIS
    );

    if (intelligence) {
      return res.json({ intelligence, stadium: stadium.name, timeFrame, focusAreas });
    }

    // Smart-engine fallback
    const riskLevel = getAnalysisRiskLabel(occupancyPct);
    const { fast: fastGate } = getCachedGateAnalysis(crowd.waitTimes || {});
    const fastGateName = fastGate ? fastGate[0] : 'Unknown';

    res.json({
      intelligence:
        `📊 OPERATIONAL INTELLIGENCE — ${stadium.name}\n\n` +
        `**Time Frame:** ${timeFrame} | **Risk Level:** ${riskLevel}\n\n` +
        `**Current Status:**\n` +
        `• Occupancy: ${occupancyPct}%\n` +
        `• Congestion: ${(crowd.hotspots || []).join(', ')}\n` +
        `• Fastest Gate: ${fastGateName}\n\n` +
        `**Predictive Insights:**\n` +
        `• Peak entry expected 30 min before kickoff\n` +
        `• Exit congestion projected 15 min post-match\n` +
        `• ${occupancyPct >= 80 ? 'High demand on concessions and restrooms' : 'Normal resource utilization'}\n\n` +
        `**Resource Recommendations:**\n` +
        `• Deploy extra staff to ${(crowd.hotspots || [])[0] || 'high-traffic zones'}\n` +
        `• Pre-stage medical teams near accessible areas\n` +
        `• Monitor ${fastGateName} for overflow\n\n` +
        `**Action Items:**\n` +
        `1. Review crowd flow every 15 min\n` +
        `2. Prepare contingency plans for ${occupancyPct >= 90 ? 'overcrowding' : 'normal operations'}\n` +
        `3. Coordinate with transport for post-match surge`,
      stadium: stadium.name, timeFrame, focusAreas, source: 'smart-engine',
    });
  })
);

// ─── EMERGENCY RESPONSE COORDINATION ───────────────────────────────────────────
router.post(
  '/emergency-response',
  requireFields(['stadiumId', 'emergencyType']),
  requireStadium,
  asyncHandler(async (req, res) => {
    const { emergencyType, severity = 'medium', affectedArea = 'general', language = DEFAULTS.LANGUAGE } = req.body;
    const stadium = req.stadium;
    const crowd = CROWD_DATA[stadium.id];
    const occupancyPct = getCachedOccupancy(crowd);

    const response = await chat(
      'You are an AI emergency response coordinator for FIFA World Cup 2026. Provide clear, actionable emergency protocols.',
      `Generate emergency response plan for ${stadium.name}:\n` +
      `- Emergency type: ${emergencyType}\n- Severity: ${severity}\n` +
      `- Affected area: ${affectedArea}\n- Occupancy: ${occupancyPct}%\n` +
      `- Medical stations: ${(stadium.facilities?.medicalStations || []).join(', ')}\n` +
      `- Accessible entrances: ${(stadium.facilities?.accessibleEntrances || []).join(', ')}\n\n` +
      `Provide: 1. Immediate actions 2. Evacuation routes 3. Staff coordination 4. Communication plan`,
      AI_PARAMS.CROWD_ANALYSIS
    );

    if (response) {
      return res.json({ response, emergencyType, severity, stadium: stadium.name });
    }

    // Smart-engine fallback
    const facilities = stadium.facilities || {};
    const medicalLocations = facilities.medicalStations || ['Medical Center'];
    const accessibleExits = facilities.accessibleEntrances || ['Main Exit'];

    res.json({
      response:
        `🚨 EMERGENCY RESPONSE — ${stadium.name}\n\n` +
        `**Type:** ${emergencyType.toUpperCase()} | **Severity:** ${severity.toUpperCase()}\n` +
        `**Affected Area:** ${affectedArea}\n\n` +
        `**IMMEDIATE ACTIONS:**\n` +
        `1. Alert all staff via radio channel 1\n` +
        `2. Activate emergency protocols for ${emergencyType}\n` +
        `3. Secure affected area: ${affectedArea}\n` +
        `4. Notify medical teams at: ${medicalLocations.join(', ')}\n\n` +
        `**EVACUATION ROUTES:**\n` +
        `• Primary: Nearest emergency exit\n` +
        `• Accessible: ${accessibleExits.join(', ')}\n` +
        `• Assembly point: Designated safe zone outside stadium\n\n` +
        `**STAFF COORDINATION:**\n` +
        `• Security: Secure perimeter and direct crowd flow\n` +
        `• Medical: Deploy to affected area and triage points\n` +
        `• Volunteers: Assist with evacuation and accessibility\n\n` +
        `**COMMUNICATION:**\n` +
        `• PA announcement in ${language}\n` +
        `• Digital signage updates\n` +
        `• App push notification to fans in affected zone`,
      emergencyType, severity, stadium: stadium.name, source: 'smart-engine',
    });
  })
);

// ─── RESOURCE OPTIMIZATION ───────────────────────────────────────────────────
router.post(
  '/resource-optimization',
  requireFields(['stadiumId']),
  requireStadium,
  asyncHandler(async (req, res) => {
    const { resourceType = 'all', optimizationGoal = 'efficiency', language = DEFAULTS.LANGUAGE } = req.body;
    const stadium = req.stadium;
    const crowd = CROWD_DATA[stadium.id];
    const occupancyPct = getCachedOccupancy(crowd);

    const optimization = await chat(
      'You are an AI resource optimization specialist for FIFA World Cup 2026. Maximize efficiency and minimize waste.',
      `Generate resource optimization plan for ${stadium.name}:\n` +
      `- Resource type: ${resourceType}\n- Goal: ${optimizationGoal}\n` +
      `- Occupancy: ${occupancyPct}%\n- Congestion: ${(crowd.hotspots || []).join(', ')}\n` +
      `- Capacity: ${stadium.capacity.toLocaleString()}\n\n` +
      `Provide: 1. Current utilization 2. Optimization strategies 3. Cost savings 4. Environmental impact`,
      AI_PARAMS.CROWD_ANALYSIS
    );

    if (optimization) {
      return res.json({ optimization, stadium: stadium.name, resourceType, optimizationGoal });
    }

    // Smart-engine fallback
    const highOccupancy = occupancyPct >= 80;
    const congestionAreas = crowd.hotspots || [];

    res.json({
      optimization:
        `⚡ RESOURCE OPTIMIZATION — ${stadium.name}\n\n` +
        `**Resource Type:** ${resourceType} | **Goal:** ${optimizationGoal}\n\n` +
        `**Current Utilization:**\n` +
        `• Staff: ${highOccupancy ? '95% deployed' : '70% deployed'}\n` +
        `• Concessions: ${highOccupancy ? 'Peak capacity' : 'Normal operations'}\n` +
        `• Medical: ${highOccupancy ? 'High demand' : 'Standard staffing'}\n` +
        `• Security: ${highOccupancy ? 'Full deployment' : 'Routine patrol'}\n\n` +
        `**Optimization Strategies:**\n` +
        `1. **Staff Allocation:**\n` +
        `   - Redirect 20% staff to ${congestionAreas[0] || 'high-traffic zones'}\n` +
        `   - Implement dynamic shift scheduling based on crowd flow\n\n` +
        `2. **Resource Management:**\n` +
        `   - Pre-stock concessions before peak periods\n` +
        `   - Deploy mobile medical units to accessible areas\n` +
        `   - Use predictive analytics for inventory\n\n` +
        `3. **Energy Efficiency:**\n` +
        `   - Adjust HVAC based on occupancy zones\n` +
        `   - Implement smart lighting in concourses\n` +
        `   - Optimize digital signage brightness\n\n` +
        `**Cost Savings:**\n` +
        `• Estimated 15-20% reduction in overtime costs\n` +
        `• 10% decrease in resource waste\n` +
        `• Improved staff utilization efficiency\n\n` +
        `**Environmental Impact:**\n` +
        `• Reduced energy consumption through smart controls\n` +
        `• Minimized food waste via predictive ordering\n` +
        `• Lower carbon footprint through optimized logistics`,
      stadium: stadium.name, resourceType, optimizationGoal, source: 'smart-engine',
    });
  })
);

module.exports = router;
