const express = require('express');
const router = express.Router();
const { chat, chatWithHistory } = require('../services/openaiService');
const { smartRespond } = require('../services/julepService');
const { STADIUMS, CROWD_DATA, MATCHES } = require('../data/stadiums');

// ─── FAN ASSISTANT (Multilingual, Navigation, FAQ) ───────────────────────────
router.post('/fan-assistant', async (req, res) => {
  try {
    const { message, language = 'English', stadiumId, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const stadium = STADIUMS.find(s => s.id === stadiumId);
    const crowd = stadiumId ? CROWD_DATA[stadiumId] : null;
    const occupancyPct = crowd ? Math.round((crowd.currentOccupancy / crowd.capacity) * 100) : null;

    const systemPrompt = `You are StadiumAI, the official AI assistant for FIFA World Cup 2026.
You are knowledgeable, friendly, and concise. Always respond in ${language}.

${stadium ? `Current Stadium: ${stadium.name}, ${stadium.city}
Capacity: ${stadium.capacity.toLocaleString()} | Current Occupancy: ${occupancyPct}%
Gates: ${stadium.gates.join(', ')}
Accessible Entrances: ${stadium.facilities.accessibleEntrances.join(', ')}
Medical Stations: ${stadium.facilities.medicalStations.join(', ')}
Family Zones: ${stadium.facilities.familyZones.join(', ')}
Prayer Rooms: ${stadium.facilities.prayerRooms.join(', ')}
Transport: ${JSON.stringify(stadium.transportation)}
${crowd ? `Hot Spots (congested areas): ${crowd.hotspots.join(', ')}` : ''}` : ''}

Your capabilities:
- Navigate fans to seats, facilities, exits, concessions
- Provide real-time crowd density and wait time info
- Assist with accessibility needs (wheelchair, visual/hearing impairment)
- Answer transportation, parking, and rideshare questions
- Translate and respond in any language requested
- Provide safety and emergency guidance
- Share sustainability tips (recycling, green transport)

Be concise (max 3-4 sentences). Use emojis sparingly for friendliness.`;

    // Try OpenAI first, fall back to smart engine
    const reply = await chatWithHistory(systemPrompt, [
      ...conversationHistory,
      { role: 'user', content: message }
    ]);

    if (reply) {
      res.json({ reply, language, stadium: stadium?.name || null });
    } else {
      // Fallback to smart rule-based engine
      const fallbackReply = smartRespond(message, stadium, crowd);
      res.json({ reply: fallbackReply, language, stadium: stadium?.name || null, source: 'smart-engine' });
    }
  } catch (err) {
    console.error('fan-assistant error:', err.message);

    // Last-resort fallback
    const stadium = STADIUMS.find(s => s.id === req.body?.stadiumId);
    const crowd = req.body?.stadiumId ? CROWD_DATA[req.body.stadiumId] : null;
    try {
      const fallback = smartRespond(req.body?.message || '', stadium, crowd);
      res.json({ reply: fallback, source: 'smart-engine-fallback' });
    } catch {
      res.status(500).json({ error: 'AI service unavailable', details: err.message });
    }
  }
});

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
router.post('/navigate', async (req, res) => {
  try {
    const { from, to, stadiumId, accessibility = false, language = 'English' } = req.body;
    if (!from || !to || !stadiumId) return res.status(400).json({ error: 'from, to, and stadiumId are required' });

    const stadium = STADIUMS.find(s => s.id === stadiumId);
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const crowd = CROWD_DATA[stadiumId];
    const hotspots = crowd?.hotspots || [];

    const prompt = `Generate step-by-step navigation instructions inside ${stadium.name} from "${from}" to "${to}".
Stadium layout: Gates ${stadium.gates.join(', ')}, Sections: Lower ${stadium.sections.lower}, Club ${stadium.sections.club}, Upper ${stadium.sections.upper}.
Current congestion hotspots to avoid: ${hotspots.join(', ')}.
${accessibility ? 'User requires wheelchair/accessibility route. Use lifts, not stairs. Use accessible entrances.' : ''}
Respond in ${language}. Format as numbered steps. Include estimated walking time.`;

    const instructions = await chat(
      'You are an expert indoor navigation system for FIFA World Cup 2026 stadiums. Provide clear, safe, step-by-step directions.',
      prompt,
      { temperature: 0.4, max_tokens: 400 }
    );

    if (instructions) {
      res.json({ instructions, from, to, stadiumId, accessibility, language });
    } else {
      // Fallback navigation
      const accessNote = accessibility
        ? '\n♿ Use accessible entrances and lifts instead of stairs.'
        : '';
      const avoidNote = hotspots.length
        ? `\n⚠️ Currently congested areas to avoid: ${hotspots.join(', ')}`
        : '';
      const fallback = `🗺️ Directions from "${from}" to "${to}" at ${stadium.name}:\n\n` +
        `1. Enter through the nearest gate (${stadium.gates[0]} or ${stadium.gates[1]})\n` +
        `2. Follow the main concourse signs toward your destination\n` +
        `3. Look for directional signage (blue for facilities, green for exits)\n` +
        `4. Ask staff in red vests for assistance if needed\n\n` +
        `⏱️ Estimated walking time: 3-7 minutes` +
        avoidNote + accessNote;
      res.json({ instructions: fallback, from, to, stadiumId, accessibility, language, source: 'smart-engine' });
    }
  } catch (err) {
    console.error('navigate error:', err.message);
    res.status(500).json({ error: 'Navigation service unavailable' });
  }
});

// ─── CROWD INTELLIGENCE ──────────────────────────────────────────────────────
router.post('/crowd-analysis', async (req, res) => {
  try {
    const { stadiumId } = req.body;
    const stadium = STADIUMS.find(s => s.id === stadiumId);
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const crowd = CROWD_DATA[stadiumId];
    const occupancyPct = Math.round((crowd.currentOccupancy / crowd.capacity) * 100);
    const waitTimes = Object.entries(crowd.waitTimes)
      .map(([gate, mins]) => `${gate}: ${mins} min`)
      .join(', ');

    const prompt = `Analyze crowd conditions at ${stadium.name}:
- Occupancy: ${crowd.currentOccupancy.toLocaleString()} / ${crowd.capacity.toLocaleString()} (${occupancyPct}%)
- Congestion hotspots: ${crowd.hotspots.join(', ')}
- Gate wait times: ${waitTimes}

Provide:
1. Risk level (Low/Medium/High/Critical)
2. Top 3 operational recommendations for staff
3. Fan advisories (which gates/areas to use or avoid)
4. Predicted next 30-min outlook
Keep it concise and actionable.`;

    const analysis = await chat(
      'You are an AI crowd safety and operations analyst for FIFA World Cup 2026 stadiums. Provide data-driven, actionable intelligence.',
      prompt,
      { temperature: 0.3, max_tokens: 500 }
    );

    if (analysis) {
      res.json({ analysis, crowdData: crowd, occupancyPct, stadium: stadium.name });
    } else {
      // Fallback crowd analysis
      const riskLevel = occupancyPct >= 95 ? '🔴 Critical' : occupancyPct >= 85 ? '🟡 High' : occupancyPct >= 70 ? '🔵 Medium' : '🟢 Low';
      const fastGate = Object.entries(crowd.waitTimes).sort((a, b) => a[1] - b[1])[0];
      const slowGate = Object.entries(crowd.waitTimes).sort((a, b) => b[1] - a[1])[0];

      const fallback = `📊 Crowd Analysis — ${stadium.name}\n\n` +
        `**Risk Level:** ${riskLevel}\n\n` +
        `**Current Status:**\n` +
        `• Occupancy: ${crowd.currentOccupancy.toLocaleString()} / ${crowd.capacity.toLocaleString()} (${occupancyPct}%)\n` +
        `• Congested areas: ${crowd.hotspots.join(', ')}\n\n` +
        `**Recommendations:**\n` +
        `1. Direct incoming fans to ${fastGate[0]} (${fastGate[1]} min wait — fastest)\n` +
        `2. Avoid routing through ${slowGate[0]} (${slowGate[1]} min wait — slowest)\n` +
        `3. ${occupancyPct >= 85 ? 'Deploy additional staff to congested zones' : 'Monitor concourse flow, no action required'}\n\n` +
        `**Fan Advisory:** Use ${fastGate[0]} for quickest entry. Avoid ${crowd.hotspots[0] || 'congested zones'}.`;
      res.json({ analysis: fallback, crowdData: crowd, occupancyPct, stadium: stadium.name, source: 'smart-engine' });
    }
  } catch (err) {
    console.error('crowd-analysis error:', err.message);
    res.status(500).json({ error: 'Crowd analysis unavailable' });
  }
});

// ─── MULTILINGUAL TRANSLATION ─────────────────────────────────────────────────
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) return res.status(400).json({ error: 'text and targetLanguage are required' });

    const translated = await chat(
      `You are a professional translator for FIFA World Cup 2026 communications. 
Translate stadium announcements, signs, and fan communications accurately and naturally.
Preserve tone: urgent messages stay urgent, friendly messages stay friendly.
Return ONLY the translated text, no explanations.`,
      `Translate to ${targetLanguage}: "${text}"`,
      { temperature: 0.2, max_tokens: 300 }
    );

    if (translated) {
      res.json({ original: text, translated, targetLanguage });
    } else {
      // Fallback: return original text with note
      res.json({
        original: text,
        translated: `[${targetLanguage}] ${text}\n\n(⚠️ AI translation is currently unavailable. Please ask a multilingual volunteer for assistance.)`,
        targetLanguage,
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('translate error:', err.message);
    res.status(500).json({ error: 'Translation service unavailable' });
  }
});

// ─── SUSTAINABILITY ADVISOR ───────────────────────────────────────────────────
router.post('/sustainability', async (req, res) => {
  try {
    const { stadiumId, query } = req.body;
    const stadium = STADIUMS.find(s => s.id === stadiumId) || STADIUMS[0];

    const prompt = `Fan query about sustainability at ${stadium.name}: "${query || 'What are the green initiatives at this venue?'}"
Stadium transport options: ${JSON.stringify(stadium.transportation)}`;

    const advice = await chat(
      `You are a sustainability advisor for FIFA World Cup 2026. 
Encourage eco-friendly choices: public transport, recycling, reducing waste.
Highlight the tournament's sustainability goals. Be encouraging and practical.
Keep response under 150 words.`,
      prompt,
      { temperature: 0.6, max_tokens: 250 }
    );

    if (advice) {
      res.json({ advice, stadium: stadium.name });
    } else {
      // Fallback sustainability tips
      const t = stadium.transportation;
      const fallback = `🌿 Sustainability at ${stadium.name}:\n\n` +
        `♻️ **Recycling:** Stations at every exit and concession area. Blue = recyclables, green = compost, black = landfill.\n\n` +
        `🚇 **Green Transport:** Taking public transit saves ~2.8kg CO₂ vs driving. ` +
        `Options: ${Array.isArray(t.subway) ? t.subway[0] : t.subway}\n\n` +
        `💧 **Water:** Refill your reusable bottle at free water stations on every level.\n\n` +
        `🥗 **Food:** Plant-based options marked with 🌱 have 60% lower carbon footprint.\n\n` +
        `🎯 FIFA WC 2026 Goal: 80% waste diversion from landfill — every fan action counts!`;
      res.json({ advice: fallback, stadium: stadium.name, source: 'smart-engine' });
    }
  } catch (err) {
    console.error('sustainability error:', err.message);
    res.status(500).json({ error: 'Sustainability service unavailable' });
  }
});

// ─── OPERATIONAL ALERT GENERATOR ─────────────────────────────────────────────
router.post('/generate-alert', async (req, res) => {
  try {
    const { situation, stadiumId, severity = 'medium', language = 'English' } = req.body;
    if (!situation) return res.status(400).json({ error: 'situation is required' });

    const stadium = STADIUMS.find(s => s.id === stadiumId);
    const location = stadium ? stadium.name : 'FIFA World Cup 2026 venue';

    const alert = await chat(
      `You are the official communication system for FIFA World Cup 2026.
Generate clear, calm, professional public address announcements.
Severity levels: low (informational), medium (advisory), high (urgent action needed).
Keep announcements under 60 words. Avoid panic-inducing language.`,
      `Generate a ${severity}-severity PA announcement for ${location}. 
Situation: ${situation}. Language: ${language}.`,
      { temperature: 0.3, max_tokens: 150 }
    );

    if (alert) {
      res.json({ alert, severity, location, language });
    } else {
      // Fallback alert generation
      const severityEmoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : 'ℹ️';
      const fallback = `${severityEmoji} ATTENTION — ${location}\n\n` +
        `${severity === 'high' ? '⚠️ URGENT: ' : ''}${situation}\n\n` +
        `${severity === 'high'
          ? 'Please follow staff directions immediately. Remain calm and proceed to the nearest exit if instructed.'
          : severity === 'medium'
            ? 'Please be aware and follow any staff instructions. Your safety is our priority.'
            : 'This is an informational update. No immediate action is required.'}\n\n` +
        `Thank you for your cooperation. — ${location} Operations`;
      res.json({ alert: fallback, severity, location, language, source: 'smart-engine' });
    }
  } catch (err) {
    console.error('generate-alert error:', err.message);
    res.status(500).json({ error: 'Alert generation unavailable' });
  }
});

// ─── VOLUNTEER BRIEFING GENERATOR ────────────────────────────────────────────
router.post('/volunteer-brief', async (req, res) => {
  try {
    const { role, stadiumId, shiftTime, language = 'English' } = req.body;
    if (!role || !stadiumId) return res.status(400).json({ error: 'role and stadiumId are required' });

    const stadium = STADIUMS.find(s => s.id === stadiumId);
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });

    const crowd = CROWD_DATA[stadiumId];
    const occupancyPct = Math.round((crowd.currentOccupancy / crowd.capacity) * 100);

    const brief = await chat(
      `You are a volunteer coordinator for FIFA World Cup 2026. 
Generate concise, role-specific shift briefings. Include key responsibilities, current conditions, and priority alerts.
Format with clear sections. Keep under 200 words.`,
      `Generate a shift briefing in ${language} for:
Role: ${role}
Stadium: ${stadium.name}, ${stadium.city}
Shift: ${shiftTime || 'Match Day'}
Current occupancy: ${occupancyPct}% 
Congestion areas: ${crowd.hotspots.join(', ')}
Accessible entrances: ${stadium.facilities.accessibleEntrances.join(', ')}`,
      { temperature: 0.5, max_tokens: 350 }
    );

    if (brief) {
      res.json({ brief, role, stadium: stadium.name, shiftTime });
    } else {
      // Fallback briefing
      const riskLevel = occupancyPct >= 90 ? 'HIGH' : occupancyPct >= 75 ? 'MODERATE' : 'STANDARD';
      const fallback = `📋 SHIFT BRIEFING — ${stadium.name}\n\n` +
        `**Role:** ${role}\n` +
        `**Shift:** ${shiftTime || 'Match Day'}\n` +
        `**Location:** ${stadium.name}, ${stadium.city}\n\n` +
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
        `Stay hydrated. Radio check every 30 minutes. Thank you for volunteering! ⚽`;
      res.json({ brief: fallback, role, stadium: stadium.name, shiftTime, source: 'smart-engine' });
    }
  } catch (err) {
    console.error('volunteer-brief error:', err.message);
    res.status(500).json({ error: 'Briefing generation unavailable' });
  }
});

module.exports = router;
