/**
 * constants.js
 * Centralised configuration values — no magic strings/numbers in route handlers.
 */

'use strict';

/** Supported alert severity levels */
const SEVERITY = Object.freeze({
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
});

/** Default values for optional request fields */
const DEFAULTS = Object.freeze({
  LANGUAGE:   'English',
  SEVERITY:   SEVERITY.MEDIUM,
  GROUP_SIZE: 1,
  SHIFT_TIME: 'Match Day',
  STADIUM_ID: 'metlife',         // fallback when no stadiumId provided
  AI_MODEL:   'gpt-4o-mini',
});

/** AI generation parameters per endpoint */
const AI_PARAMS = Object.freeze({
  FAN_ASSISTANT:  { temperature: 0.7, max_tokens: 800 },
  NAVIGATION:     { temperature: 0.4, max_tokens: 400 },
  CROWD_ANALYSIS: { temperature: 0.3, max_tokens: 500 },
  TRANSLATION:    { temperature: 0.2, max_tokens: 300 },
  SUSTAINABILITY: { temperature: 0.6, max_tokens: 250 },
  ALERT:          { temperature: 0.3, max_tokens: 150 },
  VOLUNTEER:      { temperature: 0.5, max_tokens: 350 },
  TRANSPORT:      { temperature: 0.5, max_tokens: 300 },
});

/** Maximum conversation history entries forwarded to AI (prevents prompt bloat) */
const MAX_HISTORY_TURNS = 10;

/** Session TTL in milliseconds (30 minutes) */
const SESSION_TTL_MS = 30 * 60 * 1000;

/** Session prune interval in milliseconds (10 minutes) */
const SESSION_PRUNE_INTERVAL_MS = 10 * 60 * 1000;

/** Maximum history entries per session before pruning */
const MAX_SESSION_HISTORY = 20;

module.exports = {
  SEVERITY,
  DEFAULTS,
  AI_PARAMS,
  MAX_HISTORY_TURNS,
  SESSION_TTL_MS,
  SESSION_PRUNE_INTERVAL_MS,
  MAX_SESSION_HISTORY,
};
