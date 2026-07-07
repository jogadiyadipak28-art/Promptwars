const express = require('express');
const router  = express.Router();
const { chat, chatWithHistory } = require('../services/openaiService');
const { smartRespond }          = require('../services/julepService');
const { CROWD_DATA, getStadium, calcOccupancy, fastestAndSlowestGate } = require('../data/stadiums');

// ─── FAN ASSISTANT ────────────────────────────────────────────────────────────
router.post('/fan-assistant', async (req, res) => {
  const { message, language = 'English', stadiumId, conversationHistory = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const stadium      = stadiumId ? getStadium(stadiumId) : null; // O(1)
  const crowd        = stadiumId ? CROWD_DATA[stadiumId] : null;
  const occupancyPct = crowd ? calcOccupancy(crowd) : null;       // shared utility

  try {
    const systemPrompt =
      `You are StadiumAI, the official AI assistant for FIFA World Cup 2026.\n` +
      `You are knowledgeable, friendly, and concise. Always respond in ${language}.\n\n` +
      (stadium
        ? `Current Stadium: ${stadium.name}, ${stadium.city}\n` +
          `Capacity: ${stadium.capacity.toLocaleString()} | Current Occupancy: ${occupancyPct}%\n` +
          `Gates: ${stadium.gates.join(', ')}\n` +
          `Accessible Entrances: ${stadium.facilities.accessibleEntrances.join(', ')}\n` +
          `Medical Stations: ${stadium.facilities.medicalStations.join(', ')}\n` +
          `Family Zones: ${stadium.facilities.familyZones.join(', ')}\n` +
          `Prayer Rooms: ${stadium.facilities.prayerRooms.join(', ')}\n` +
          `Transport: ${JSON.stringify(stadium.transportation)}\n` +
          (crowd ? `Hot Spots (congested areas): ${crowd.hotspots.join(', ')}\n` : '')
        : '') +
      `\nBe concise (max 3-4 sentences). Use emojis sparingly for friendliness.`;

    const reply = await chatWithHistory(systemPrompt, [
      ...conversationHistory,
      { role: 'user', content: message },
    ]);

    if (reply) return res.json({ reply, language, stadium: stadium?.name || null });

    // Fallback — stadium/crowd already resolved above, no duplicate lookup
    const fallbackReply = smartRespond(message, stadium, crowd);
    res.json({ reply: fallbackReply, language, stadium: stadium?.name || null, source: 'smart-engine' });
  } catch (err) {
    console.error('fan-assistant error:', err.message);
    try {
      // Reuse already-resolved stadium/crowd — no second STADIUMS.find()
      res.json({ reply: smartRespond(message, stadium, crowd), source: 'smart-engine-fallback' });
    } catch {
      res.status(500).json({ error: 'AI service unavailable', details: err.message });
    }
  }
});

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
router.post('/navigate', async (req, res) => {
  try {
    const { from, to, stadiumId, accessibility = false, language = 'English' } = req.body;
    if (!from || !to || !stadiumId) {
      return res.status(400).json({ error: 'from, to, and stadiumId are required' });
    }

    const stadium = getStadium(stadiumId); // O(1)
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const hotspots = CROWD_DATA[stadiumId]?.hotspots || [];

    const prompt =
      `Generate step-by-step navigation instructions inside ${stadium.name} from "${from}" to "${to}".\n` +
      `Stadium layout: Gates ${stadium.gates.join(', ')}, Sections: Lower ${stadium.sections.lower}, Club ${stadium.sections.club}, Upper ${stadium.sections.upper}.\n` +
      `Current congestion hotspots to avoid: ${hotspots.join(', ')}.\n` +
      (accessibility ? 'User requires wheelchair/accessibility route. Use lifts, not stairs.\n' : '') +
      `Respond in ${language}. Format as numbered steps. Include estimated walking time.`;

    const instructions = await chat(
      'You are an expert indoor navigation system for FIFA World Cup 2026 stadiums. Provide clear, safe, step-by-step directions.',
      prompt,
      { temperature: 0.4, max_tokens: 400 }
    );

    if (instructions) return res.json({ instructions, from, to, stadiumId, accessibility, language });

    const avoidNote  = hotspots.length ? `\n⚠️ Avoid: ${hotspots.join(', ')}` : '';
    const accessNote = accessibility ? '\n♿ Use accessible entrances and lifts.' : '';
    res.json({
      instructions:
        `🗺️ Directions from "${from}" to "${to}" at ${stadium.name}:\n\n` +
        `1. Enter through the nearest gate (${stadium.gates[0]} or ${stadium.gates[1]})\n` +
        `2. Follow the main concourse signs toward your destination\n` +
        `3. Look for directional signage (blue for facilities, green for exits)\n` +
        `4. Ask staff in red vests for assistance if needed\n\n` +
        `⏱️ Estimated walking time: 3-7 minutes` + avoidNote + accessNote,
      from, to, stadiumId, accessibility, language, source: 'smart-engine',
    });
  } catch (err) {
    console.error('navigate error:', err.message);
    res.status(500).json({ error: 'Navigation service unavailable' });
  }
});

// ─── CROWD INTELLIGENCE ───────────────────────────────────────────────────────
router.post('/crowd-analysis', async (req, res) => {
  try {
    const { stadiumId } = req.body;
    const stadium = getStadium(stadiumId); // O(1)
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const crowd        = CROWD_DATA[stadiumId];
    const occupancyPct = calcOccupancy(crowd); // shared utility

    // Single-pass to find fastest + slowest gate — O(n) not O(2n)
    const { fast: fastGate, slow: slowGate } = fastestAndSlowestGate(crowd.waitTimes);

    const waitTimesStr = Object.entries(crowd.waitTimes)
      .map(([gate, mins]) => `${gate}: ${mins} min`)
      .join(', ');

    const analysis = await chat(
      'You are an AI crowd safety and operations analyst for FIFA World Cup 2026 stadiums. Provide data-driven, actionable intelligence.',
      `Analyze crowd conditions at ${stadium.name}:\n` +
      `- Occupancy: ${crowd.currentOccupancy.toLocaleString()} / ${crowd.capacity.toLocaleString()} (${occupancyPct}%)\n` +
      `- Congestion hotspots: ${crowd.hotspots.join(', ')}\n` +
      `- Gate wait times: ${waitTimesStr}\n\n` +
      `Provide:\n1. Risk level\n2. Top 3 recommendations\n3. Fan advisories\n4. 30-min outlook`,
      { temperature: 0.3, max_tokens: 500 }
    );

    if (analysis) return res.json({ analysis, crowdData: crowd, occupancyPct, stadium: stadium.name });

    const riskLevel =
      occupancyPct >= 95 ? '🔴 Critical' :
      occupancyPct >= 85 ? '🟡 High' :
      occupancyPct >= 70 ? '🔵 Medium' : '🟢 Low';

    res.json({
      analysis:
        `📊 Crowd Analysis — ${stadium.name}\n\n` +
        `**Risk Level:** ${riskLevel}\n\n` +
        `**Current Status:**\n` +
        `• Occupancy: ${crowd.currentOccupancy.toLocaleString()} / ${crowd.capacity.toLocaleString()} (${occupancyPct}%)\n` +
        `• Congested areas: ${crowd.hotspots.join(', ')}\n\n` +
        `**Recommendations:**\n` +
        `1. Direct fans to ${fastGate[0]} (${fastGate[1]} min wait — fastest)\n` +
        `2. Avoid ${slowGate[0]} (${slowGate[1]} min wait — slowest)\n` +
        `3. ${occupancyPct >= 85 ? 'Deploy additional staff to congested zones' : 'Monitor concourse flow — no action required'}\n\n` +
        `**Fan Advisory:** Use ${fastGate[0]} for quickest entry. Avoid ${crowd.hotspots[0] || 'congested zones'}.`,
      crowdData: crowd, occupancyPct, stadium: stadium.name, source: 'smart-engine',
    });
  } catch (err) {
    console.error('crowd-analysis error:', err.message);
    res.status(500).json({ error: 'Crowd analysis unavailable' });
  }
});

// ─── TRANSLATION ──────────────────────────────────────────────────────────────
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'text and targetLanguage are required' });
    }

    const translated = await chat(
      `You are a professional translator for FIFA World Cup 2026 communications.\n` +
      `Translate accurately and naturally. Preserve tone.\n` +
      `Return ONLY the translated text, no explanations.`,
      `Translate to ${targetLanguage}: "${text}"`,
      { temperature: 0.2, max_tokens: 300 }
    );

    if (translated) return res.json({ original: text, translated, targetLanguage });

    res.json({
      original:   text,
      translated: `[${targetLanguage}] ${text}\n\n(⚠️ AI translation unavailable. Please ask a multilingual volunteer.)`,
      targetLanguage,
      source: 'fallback',
    });
  } catch (err) {
    console.error('translate error:', err.message);
    res.status(500).json({ error: 'Translation service unavailable' });
  }
});

// ─── SUSTAINABILITY ───────────────────────────────────────────────────────────
router.post('/sustainability', async (req, res) => {
  try {
    const { stadiumId, query } = req.body;
    // Fallback to first stadium if none given — O(1) lookup where possible
    const stadium = (stadiumId ? getStadium(stadiumId) : null) || getStadium('metlife');

    const advice = await chat(
      `You are a sustainability advisor for FIFA World Cup 2026.\n` +
      `Encourage eco-friendly choices. Keep response under 150 words.`,
      `Fan query at ${stadium.name}: "${query || 'What are the green initiatives here?'}"\n` +
      `Transport options: ${JSON.stringify(stadium.transportation)}`,
      { temperature: 0.6, max_tokens: 250 }
    );

    if (advice) return res.json({ advice, stadium: stadium.name });

    const subwayLine = Array.isArray(stadium.transportation.subway)
      ? stadium.transportation.subway[0]
      : stadium.transportation.subway;

    res.json({
      advice:
        `🌿 Sustainability at ${stadium.name}:\n\n` +
        `♻️ Recycling stations at every exit — blue = recyclables, green = compost, black = landfill.\n\n` +
        `🚇 Public transit saves ~2.8kg CO₂ vs driving. Take: ${subwayLine}\n\n` +
        `💧 Free water refill stations on every level.\n\n` +
        `🥗 Plant-based options marked with 🌱 have 60% lower carbon footprint.\n\n` +
        `🎯 FIFA WC 2026 Goal: 80% waste diversion — every fan counts!`,
      stadium: stadium.name, source: 'smart-engine',
    });
  } catch (err) {
    console.error('sustainability error:', err.message);
    res.status(500).json({ error: 'Sustainability service unavailable' });
  }
});

// ─── ALERT GENERATOR ──────────────────────────────────────────────────────────
router.post('/generate-alert', async (req, res) => {
  try {
    const { situation, stadiumId, severity = 'medium', language = 'English' } = req.body;
    if (!situation) return res.status(400).json({ error: 'situation is required' });

    const stadium  = stadiumId ? getStadium(stadiumId) : null; // O(1)
    const location = stadium ? stadium.name : 'FIFA World Cup 2026 venue';

    const alert = await chat(
      `You are the official communication system for FIFA World Cup 2026.\n` +
      `Generate clear, calm PA announcements. Keep under 60 words. Avoid panic.`,
      `Generate a ${severity}-severity PA announcement for ${location}.\nSituation: ${situation}. Language: ${language}.`,
      { temperature: 0.3, max_tokens: 150 }
    );

    if (alert) return res.json({ alert, severity, location, language });

    const emoji    = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : 'ℹ️';
    const guidance =
      severity === 'high'
        ? 'Please follow staff directions immediately. Remain calm and proceed to the nearest exit if instructed.'
        : severity === 'medium'
        ? 'Please be aware and follow staff instructions. Your safety is our priority.'
        : 'This is an informational update. No immediate action required.';

    res.json({
      alert:
        `${emoji} ATTENTION — ${location}\n\n` +
        `${severity === 'high' ? '⚠️ URGENT: ' : ''}${situation}\n\n` +
        `${guidance}\n\nThank you for your cooperation. — ${location} Operations`,
      severity, location, language, source: 'smart-engine',
    });
  } catch (err) {
    console.error('generate-alert error:', err.message);
    res.status(500).json({ error: 'Alert generation unavailable' });
  }
});

// ─── VOLUNTEER BRIEFING ───────────────────────────────────────────────────────
router.post('/volunteer-brief', async (req, res) => {
  try {
    const { role, stadiumId, shiftTime, language = 'English' } = req.body;
    if (!role || !stadiumId) return res.status(400).json({ error: 'role and stadiumId are required' });

    const stadium = getStadium(stadiumId); // O(1)
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const crowd        = CROWD_DATA[stadiumId];
    const occupancyPct = calcOccupancy(crowd); // shared utility

    const brief = await chat(
      `You are a volunteer coordinator for FIFA World Cup 2026.\n` +
      `Generate concise role-specific shift briefings. Format with clear sections. Keep under 200 words.`,
      `Briefing in ${language} for:\nRole: ${role}\nStadium: ${stadium.name}, ${stadium.city}\n` +
      `Shift: ${shiftTime || 'Match Day'}\nCurrent occupancy: ${occupancyPct}%\n` +
      `Congestion areas: ${crowd.hotspots.join(', ')}\n` +
      `Accessible entrances: ${stadium.facilities.accessibleEntrances.join(', ')}`,
      { temperature: 0.5, max_tokens: 350 }
    );

    if (brief) return res.json({ brief, role, stadium: stadium.name, shiftTime });

    const riskLevel =
      occupancyPct >= 90 ? 'HIGH' :
      occupancyPct >= 75 ? 'MODERATE' : 'STANDARD';

    res.json({
      brief:
        `📋 SHIFT BRIEFING — ${stadium.name}\n\n` +
        `**Role:** ${role}\n**Shift:** ${shiftTime || 'Match Day'}\n**Location:** ${stadium.name}, ${stadium.city}\n\n` +
        `**Current Conditions:**\n` +
        `• Occupancy: ${occupancyPct}% (${riskLevel} alert level)\n` +
        `• Congestion areas: ${crowd.hotspots.join(', ')}\n\n` +
        `**Key Responsibilities:**\n` +
        `1. Assist fans with wayfinding and ticket scanning\n` +
        `2. Monitor assigned zone for safety concerns\n` +
        `3. Direct fans to accessible entrances: ${stadium.facilities.accessibleEntrances.join(', ')}\n` +
        `4. Report any incidents to control room immediately\n\n` +
        `**Priority Alerts:**\n` +
        `• ${occupancyPct >= 85 ? 'High crowd density — extra vigilance required' : 'Normal operations — standard monitoring'}\n` +
        `• Medical stations: ${stadium.facilities.medicalStations.join(', ')}\n\n` +
        `Stay hydrated. Radio check every 30 minutes. Thank you for volunteering! ⚽`,
      role, stadium: stadium.name, shiftTime, source: 'smart-engine',
    });
  } catch (err) {
    console.error('volunteer-brief error:', err.message);
    res.status(500).json({ error: 'Briefing generation unavailable' });
  }
});

module.exports = router;
