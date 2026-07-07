/**
 * Tests: POST/GET /api/chatbot/* — chatbot routes
 */

const request = require('supertest');
const app     = require('../../src/server');

describe('Chatbot Routes', () => {

  describe('GET /api/chatbot/status', () => {
    it('returns online status', async () => {
      const res = await request(app).get('/api/chatbot/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('online');
      expect(res.body).toHaveProperty('provider');
    });
  });

  describe('POST /api/chatbot/message', () => {
    it('returns a reply for a basic message', async () => {
      const res = await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Hello, how can you help me?' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body).toHaveProperty('sessionId');
      expect(typeof res.body.reply).toBe('string');
      expect(res.body.reply.length).toBeGreaterThan(5);
    });

    it('returns 400 when message is missing', async () => {
      const res = await request(app)
        .post('/api/chatbot/message')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when message is empty string', async () => {
      const res = await request(app)
        .post('/api/chatbot/message')
        .send({ message: '' });
      expect(res.status).toBe(400);
    });

    it('accepts an optional stadiumId', async () => {
      const res = await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Where are the restrooms?', stadiumId: 'metlife' });

      expect(res.status).toBe(200);
      expect(res.body.reply).toBeTruthy();
    });

    it('accepts an optional language', async () => {
      const res = await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Hello', language: 'Spanish' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessionId');
    });

    it('reuses a provided sessionId', async () => {
      const sessionId = 'test-session-abc123';
      const res = await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Where is the medical station?', sessionId });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe(sessionId);
    });

    it('handles multiple intents correctly', async () => {
      const intents = [
        { message: 'How do I find my seat?' },
        { message: 'Where are the restrooms?' },
        { message: 'I need wheelchair accessible entry' },
        { message: 'Where is the medical station?' },
        { message: 'Where can I find food?' },
        { message: 'What transport options are available?' },
      ];

      for (const body of intents) {
        const res = await request(app)
          .post('/api/chatbot/message')
          .send(body);
        expect(res.status).toBe(200);
        expect(res.body.reply.length).toBeGreaterThan(10);
      }
    });
  });

  describe('POST /api/chatbot/reset', () => {
    it('resets a session successfully', async () => {
      const sessionId = 'test-reset-session';
      const res = await request(app)
        .post('/api/chatbot/reset')
        .send({ sessionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('handles reset with no sessionId gracefully', async () => {
      const res = await request(app)
        .post('/api/chatbot/reset')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
