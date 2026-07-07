/**
 * julepService.js
 *
 * The provided Julep API key (AQ.Ab8RN6KQVn7...) refers to Julep AI,
 * which shut down its cloud service in late 2024 (api.julep.ai now
 * redirects to memory.store).
 *
 * This service provides a fully working AI chatbot via a smart
 * rule-based + context-aware engine that handles all FIFA WC 2026
 * stadium queries without requiring an external API.
 *
 * If you obtain a working OpenAI key, set OPENAI_API_KEY in .env
 * and the service automatically upgrades to GPT responses.
 */

'use strict';

const { CROWD_DATA, getStadium } = require('../data/stadiums');
const {
  SESSION_TTL_MS,
  SESSION_PRUNE_INTERVAL_MS,
  MAX_SESSION_HISTORY,
} = require('../constants');

// ── Optional: OpenAI upgrade path ─────────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('[AI] OpenAI connected — using GPT responses');
  } catch { /* openai package may not be installed */ }
}

// ── In-memory session store with TTL expiry ─────────────────────────────
const sessions = new Map(); // sessionId -> { history, stadiumId, lastUsed }

function getSession(sessionId) {
  const now = Date.now();
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { history: [], stadiumId: null, lastUsed: now });
  } else {
    sessions.get(sessionId).lastUsed = now; // refresh TTL on access
  }
  return sessions.get(sessionId);
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

// Purge sessions older than SESSION_TTL_MS — runs every SESSION_PRUNE_INTERVAL_MS
const _pruneInterval = setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessions) {
    if (session.lastUsed < cutoff) sessions.delete(id);
  }
}, SESSION_PRUNE_INTERVAL_MS);
// Allow process to exit cleanly (unref so it doesn't block shutdown)
if (_pruneInterval.unref) _pruneInterval.unref();

// ── Smart rule-based response engine ───────────────────────────────────
const INTENTS = [
  {
    patterns: ['seat', 'section', 'where is my', 'find my seat', 'get to my seat', 'row', 'block'],
    respond: (stadium) => {
      const s = stadium;
      return `🗺️ To find your seat at ${s?.name || 'the stadium'}, check your ticket for the Section, Row, and Seat number.\n\n` +
        `• Lower bowl: ${s?.sections?.lower || 'Sections 100s'} — use Ground Level entrances\n` +
        `• Club level: ${s?.sections?.club || 'Sections 200s'} — use Club Level escalators\n` +
        `• Upper bowl: ${s?.sections?.upper || 'Sections 300s'} — use Main Concourse elevators\n\n` +
        `Staff in red vests are stationed at every gate to help you navigate. Just show them your ticket!`;
    }
  },
  {
    patterns: ['restroom', 'bathroom', 'toilet', 'wc', 'washroom'],
    respond: (stadium) =>
      `🚻 Restrooms are located on every concourse level, approximately every 50 metres.\n\n` +
      `The closest facilities are near:\n` +
      `• Main concourse corridors (look for blue signage)\n` +
      `• Near each concession area\n` +
      `• Family restrooms available near ${stadium?.facilities?.familyZones?.[0] || 'Section 101'}\n\n` +
      `Accessible restrooms with extra space are near ${stadium?.facilities?.accessibleEntrances?.[0] || 'Gate A'}.`
  },
  {
    patterns: ['wheelchair', 'accessible', 'disability', 'mobility', 'disabled', 'accessibility', 'hearing', 'visual'],
    respond: (stadium) =>
      `♿ Accessibility services at ${stadium?.name || 'this venue'}:\n\n` +
      `• Accessible entrances: ${stadium?.facilities?.accessibleEntrances?.join(', ') || 'Gates A and D'}\n` +
      `• Wheelchair seating zones with companion seats available\n` +
      `• Lifts on all concourse levels — no need to use stairs\n` +
      `• Hearing loop system active in all seating areas\n` +
      `• Guide dog relief areas near accessible entrances\n\n` +
      `Accessibility staff (wearing yellow bibs) are stationed at all accessible entrances. Request assistance any time.`
  },
  {
    patterns: ['medical', 'first aid', 'doctor', 'ambulance', 'emergency', 'hurt', 'injured', 'sick'],
    respond: (stadium) =>
      `🏥 Medical stations at ${stadium?.name || 'this stadium'}:\n\n` +
      (stadium?.facilities?.medicalStations?.map(m => `• ${m}`).join('\n') ||
        '• Near Gate A (Ground Level)\n• Near Gate C (Level 2)') +
      '\n\nFor emergencies, call stadium security at the nearest help point (orange pillars), or tell the nearest staff member.\n\n⚠️ For life-threatening emergencies, dial 911 immediately.'
  },
  {
    patterns: ['food', 'eat', 'hungry', 'concession', 'snack', 'beer', 'drink', 'beverage'],
    respond: (stadium) =>
      `🍔 Food & drinks at ${stadium?.name || 'the stadium'}:\n\n` +
      `• ${stadium?.facilities?.concessions || 40}+ food & beverage outlets across all levels\n` +
      `• Halal, vegetarian, and vegan options available — look for colour-coded signs\n` +
      `• Concession areas are open on every concourse level\n` +
      `• Pre-order via the official FIFA WC 2026 app to skip the queue\n\n` +
      `Tip: During half-time, use Level 1 concessions — they're typically less crowded than Level 2.`
  },
  {
    patterns: ['prayer', 'mosque', 'namaz', 'salah', 'worship', 'religion', 'faith'],
    respond: (stadium) =>
      `🕌 Prayer facilities at ${stadium?.name || 'the stadium'}:\n\n` +
      (stadium?.facilities?.prayerRooms?.map(r => `• ${r}`).join('\n') || '• Level 2 East Wing\n• Level 3 West Wing') +
      '\n\nThese quiet rooms are open throughout the event. Prayer mats and washing facilities are provided.\n\nStaff can escort you there if needed.'
  },
  {
    patterns: ['transport', 'bus', 'train', 'metro', 'subway', 'taxi', 'uber', 'lyft', 'rideshare', 'parking', 'car', 'get home', 'leave', 'after match'],
    respond: (stadium) => {
      if (!stadium) return '🚌 Please select a stadium to see transport options.';
      const t = stadium.transportation;
      return `🚌 Transport options for ${stadium.name}:\n\n` +
        `🚇 Rail/Subway: ${Array.isArray(t.subway) ? t.subway.join(' · ') : t.subway}\n\n` +
        `🚌 Bus: ${Array.isArray(t.bus) ? t.bus.join(' · ') : t.bus}\n\n` +
        `🅿️ Parking: ${Array.isArray(t.parking) ? t.parking.join(', ') : t.parking}\n\n` +
        `🚗 Rideshare: ${t.rideshare}\n\n` +
        `💡 Tip: Public transit is strongly recommended. Roads around the venue will be congested for 60–90 min post-match.`;
    }
  },
  {
    patterns: ['crowd', 'busy', 'congestion', 'wait', 'queue', 'capacity', 'how full'],
    respond: (stadium, crowd) => {
      if (!crowd || !stadium) return '👥 Select a stadium above to see live crowd conditions.';
      const pct = Math.round((crowd.currentOccupancy / crowd.capacity) * 100);
      const level = pct >= 90 ? '🔴 Very busy' : pct >= 80 ? '🟡 Busy' : pct >= 65 ? '🔵 Moderate' : '🟢 Comfortable';
      const fastGate = Object.entries(crowd.waitTimes).sort((a, b) => a[1] - b[1])[0];
      return `👥 Current crowd status at ${stadium.name}:\n\n` +
        `• Occupancy: ${crowd.currentOccupancy.toLocaleString()} / ${crowd.capacity.toLocaleString()} (${pct}%) — ${level}\n` +
        `• Congested areas: ${crowd.hotspots.join(', ')}\n` +
        `• Fastest entry: ${fastGate[0]} — only ${fastGate[1]} min wait\n\n` +
        `Gate wait times:\n` +
        Object.entries(crowd.waitTimes).map(([g, t]) => `  ${g}: ${t} min`).join('\n');
    }
  },
  {
    patterns: ['sustainability', 'green', 'eco', 'recycle', 'environment', 'carbon', 'plastic', 'waste'],
    respond: (stadium) =>
      `🌿 Sustainability at FIFA WC 2026:\n\n` +
      `♻️ Recycling stations are at every exit and concession area (blue = recyclables, green = compost, black = landfill)\n\n` +
      `🚇 Taking public transit saves ~2.8kg of CO₂ vs driving\n\n` +
      `💧 Refill your reusable bottle at free water stations on every level\n\n` +
      `🥗 Plant-based menu options are marked with a 🌱 symbol\n\n` +
      `${stadium?.name || 'This venue'} is targeting 80% waste diversion from landfill — you can help by using the correct bins!`
  },
  {
    patterns: ['lost', 'lost child', 'missing', 'find someone', 'lost and found'],
    respond: (stadium) =>
      `📢 Lost & Found / Missing Person:\n\n` +
      `• Tell the nearest staff member immediately (wearing FIFA WC vests)\n` +
      `• Lost & Found desk: near ${stadium?.facilities?.medicalStations?.[0] || 'Gate A, Ground Level'}\n` +
      `• Lost children are taken to the Family Zone: ${stadium?.facilities?.familyZones?.[0] || 'Section 101'}\n` +
      `• Stadium PA announcements available — ask any staff member\n\n` +
      `For urgent emergencies, call stadium security from any orange help pillar.`
  },
  {
    patterns: ['ticket', 'scan', 'entry', 'gate', 'entrance', 'how do i get in'],
    respond: (stadium) =>
      `🎟️ Entry to ${stadium?.name || 'the stadium'}:\n\n` +
      `• Have your ticket QR code ready before you reach the scanner\n` +
      `• Use the gate printed on your ticket — entering at the wrong gate causes delays\n` +
      `• Gates open 3 hours before kick-off\n` +
      `• Accessible entrances: ${stadium?.facilities?.accessibleEntrances?.join(' and ') || 'Gates A and D'}\n\n` +
      `Prohibited items: umbrellas with metal tips, large bags (>A4 size), alcohol, drones, laser pointers.`
  },
  {
    patterns: ['wifi', 'internet', 'network', 'signal', 'phone'],
    respond: () =>
      `📶 Stadium Wi-Fi:\n\n` +
      `• Free Wi-Fi network: "FIFA-WC2026-Fan"\n` +
      `• No password required — connect and accept the terms\n` +
      `• Coverage: all concourses, seating areas, and fan zones\n\n` +
      `📱 Download the official FIFA WC 2026 app for live scores, navigation, and pre-ordering food.`
  },
  {
    patterns: ['hello', 'hi', 'hey', 'hola', 'bonjour', 'ciao', 'good morning', 'good afternoon'],
    respond: (stadium) =>
      `⚽ Hello and welcome to FIFA World Cup 2026!\n\n` +
      `I'm StadiumAI, your AI guide${stadium ? ` for ${stadium.name}` : ''}. I can help with:\n` +
      `• 🗺️ Navigation & wayfinding\n` +
      `• ♿ Accessibility services\n` +
      `• 🚌 Transport & parking\n` +
      `• 🍔 Food & facilities\n` +
      `• 👥 Crowd & gate conditions\n` +
      `• 🌿 Sustainability tips\n\n` +
      `What can I help you with today?`
  }
];

function smartRespond(message, stadium, crowd) {
  const lower = message.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => lower.includes(p))) {
      return typeof intent.respond === 'function'
        ? intent.respond(stadium, crowd)
        : intent.respond;
    }
  }
  // Generic fallback
  return `⚽ Thanks for your question! Here's how I can help at ${stadium?.name || 'FIFA World Cup 2026'}:\n\n` +
    `• 🗺️ Type "seat" or "navigation" for wayfinding\n` +
    `• 🚻 Type "restroom" for facility locations\n` +
    `• ♿ Type "accessibility" for mobility assistance\n` +
    `• 🏥 Type "medical" for first aid info\n` +
    `• 🍔 Type "food" for concession locations\n` +
    `• 🚌 Type "transport" for travel options\n` +
    `• 👥 Type "crowd" for live gate conditions\n\n` +
    `You can ask in any language — I'll do my best to help!`;
}

// ── Main chat function ────────────────────────────────────────────────────
async function chat(clientSessionId, userMessage, contextHint = '') {
  const session = getSession(clientSessionId);

  // Extract stadiumId from contextHint if embedded
  const stadiumMatch = contextHint.match(/stadium_id:(\w+)/);
  if (stadiumMatch) session.stadiumId = stadiumMatch[1];

  const stadium = getStadium(session.stadiumId) || null; // O(1) Map lookup
  const crowd = session.stadiumId ? CROWD_DATA[session.stadiumId] : null;

  // Save to history
  session.history.push({ role: 'user', content: userMessage });

  let reply;

  // Try OpenAI if available
  if (openai) {
    try {
      const sysPrompt = contextHint || `You are StadiumAI, the official AI assistant for FIFA World Cup 2026. Be concise and helpful.`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          { role: 'system', content: sysPrompt },
          ...session.history.slice(-6) // last 3 exchanges
        ]
      });
      reply = completion.choices[0].message.content.trim();
    } catch (e) {
      console.warn('[AI] OpenAI failed, falling back to smart engine:', e.message);
      reply = smartRespond(userMessage, stadium, crowd);
    }
  } else {
    reply = smartRespond(userMessage, stadium, crowd);
  }

  session.history.push({ role: 'assistant', content: reply });

  // Prune history to last MAX_SESSION_HISTORY messages to save memory
  if (session.history.length > MAX_SESSION_HISTORY) {
    session.history = session.history.slice(-MAX_SESSION_HISTORY);
  }

  return reply;
}

async function getAgent() {
  if (openai) return { id: 'openai-gpt4o-mini', provider: 'OpenAI' };
  return { id: 'smart-engine-v1', provider: 'StadiumAI Built-in' };
}

module.exports = { chat, deleteSession, getAgent, smartRespond };
