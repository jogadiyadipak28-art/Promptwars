/**
 * openaiService.js
 *
 * Wraps OpenAI API calls. If OPENAI_API_KEY is not set or empty,
 * functions return null so callers can fall back to rule-based responses.
 */

'use strict';

let openai = null;
const apiKey = process.env.OPENAI_API_KEY;

if (apiKey && apiKey.trim()) {
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: apiKey.trim() });
    console.log('[AI] OpenAI connected — GPT responses enabled');
  } catch (err) {
    console.warn('[AI] Failed to initialize OpenAI:', err.message);
  }
} else {
  console.log('[AI] No OPENAI_API_KEY set — using built-in smart engine fallback');
}

/**
 * Core chat completion wrapper with system prompt injection.
 * Returns null if OpenAI is unavailable, so callers can fall back.
 *
 * @param {string} systemPrompt - System prompt defining AI behavior
 * @param {string} userMessage - User message to process
 * @param {Object} options - Optional configuration
 * @param {number} [options.temperature=0.7] - Response randomness (0-2)
 * @param {number} [options.max_tokens=600] - Maximum response tokens
 * @param {string} [options.model='gpt-4o-mini'] - OpenAI model to use
 * @returns {Promise<string|null>} AI response or null if unavailable
 */
async function chat(systemPrompt, userMessage, options = {}) {
  if (!openai) return null;

  const { temperature = 0.7, max_tokens = 600, model = 'gpt-4o-mini' } = options;
  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error('[AI] OpenAI chat error:', err.message);
    return null;
  }
}

/**
 * Multi-turn conversation support with message history.
 * Returns null if OpenAI is unavailable, so callers can fall back.
 *
 * @param {string} systemPrompt - System prompt defining AI behavior
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {Object} options - Optional configuration
 * @param {number} [options.temperature=0.7] - Response randomness (0-2)
 * @param {number} [options.max_tokens=800] - Maximum response tokens
 * @param {string} [options.model='gpt-4o-mini'] - OpenAI model to use
 * @returns {Promise<string|null>} AI response or null if unavailable
 */
async function chatWithHistory(systemPrompt, messages, options = {}) {
  if (!openai) return null;

  const { temperature = 0.7, max_tokens = 800, model = 'gpt-4o-mini' } = options;
  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages]
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error('[AI] OpenAI chatWithHistory error:', err.message);
    return null;
  }
}

/**
 * Checks if OpenAI service is connected and available.
 *
 * @returns {boolean} True if OpenAI is available, false otherwise
 */
function isAvailable() {
  return openai !== null;
}

module.exports = { chat, chatWithHistory, isAvailable };
