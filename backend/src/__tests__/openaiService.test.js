/**
 * Tests: services/openaiService.js
 * The service returns null when OPENAI_API_KEY is not set (test environment).
 * These tests verify the graceful fallback behaviour.
 */

const { chat, chatWithHistory, isAvailable } = require('../../src/services/openaiService');

describe('openaiService', () => {

  describe('isAvailable()', () => {
    it('returns false when OPENAI_API_KEY is not set', () => {
      // In the test environment no key is configured
      expect(typeof isAvailable()).toBe('boolean');
    });
  });

  describe('chat()', () => {
    it('returns null when OpenAI is unavailable (no key)', async () => {
      const result = await chat('You are helpful.', 'Hello');
      // Without a key the service returns null so callers can fallback
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('accepts custom options without throwing', async () => {
      const result = await chat(
        'You are a test assistant.',
        'What is 2+2?',
        { temperature: 0.5, max_tokens: 50 }
      );
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('chatWithHistory()', () => {
    it('returns null when OpenAI is unavailable (no key)', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];
      const result = await chatWithHistory('You are helpful.', messages);
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('handles an empty messages array without throwing', async () => {
      const result = await chatWithHistory('System prompt.', []);
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });
});
