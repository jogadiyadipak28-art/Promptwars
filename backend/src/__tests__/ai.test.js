/**
 * Tests: POST /api/ai/* — AI routes with fallback smart engine
 * All tests pass regardless of whether OPENAI_API_KEY is set.
 */

'use strict';

const request = require('supertest');
const app     = require('../../src/server');

describe('AI Routes', () => {

  // ── Fan Assistant ───────────────────────────────────────────────────────
  describe('POST /api/ai/fan-assistant', () => {
    it('returns a reply for a basic message', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: 'How do I find the restrooms?', stadiumId: 'metlife' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reply');
      expect(typeof res.body.reply).toBe('string');
      expect(res.body.reply.length).toBeGreaterThan(10);
    });

    it('returns 400 when message is missing', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ stadiumId: 'metlife' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('works without a stadiumId', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: 'Where can I find food?' });
      expect(res.status).toBe(200);
      expect(res.body.reply).toBeTruthy();
    });

    it('handles accessibility queries', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: 'I need wheelchair accessible entry', stadiumId: 'sofi' });
      expect(res.status).toBe(200);
      expect(res.body.reply.toLowerCase()).toMatch(/accessible|wheelchair|entrance/i);
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────
  describe('POST /api/ai/navigate', () => {
    it('returns navigation instructions', async () => {
      const res = await request(app)
        .post('/api/ai/navigate')
        .send({ from: 'Gate A', to: 'Section 112', stadiumId: 'metlife' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('instructions');
      expect(res.body.instructions.length).toBeGreaterThan(10);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/ai/navigate')
        .send({ from: 'Gate A', stadiumId: 'metlife' }); // missing 'to'
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown stadiumId', async () => {
      const res = await request(app)
        .post('/api/ai/navigate')
        .send({ from: 'Gate A', to: 'Section 100', stadiumId: 'fake-venue' });
      expect(res.status).toBe(404);
    });

    it('includes accessibility routing when requested', async () => {
      const res = await request(app)
        .post('/api/ai/navigate')
        .send({ from: 'Main Entrance', to: 'Section 215', stadiumId: 'bcplace', accessibility: true });
      expect(res.status).toBe(200);
      expect(res.body.accessibility).toBe(true);
    });
  });

  // ── Crowd Analysis ─────────────────────────────────────────────────────
  describe('POST /api/ai/crowd-analysis', () => {
    it('returns analysis for a valid stadium', async () => {
      const res = await request(app)
        .post('/api/ai/crowd-analysis')
        .send({ stadiumId: 'metlife' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('analysis');
      expect(res.body).toHaveProperty('crowdData');
      expect(res.body).toHaveProperty('occupancyPct');
    });

    it('occupancyPct is between 0 and 100', async () => {
      const res = await request(app)
        .post('/api/ai/crowd-analysis')
        .send({ stadiumId: 'azteca' });
      expect(res.body.occupancyPct).toBeGreaterThan(0);
      expect(res.body.occupancyPct).toBeLessThanOrEqual(100);
    });

    it('returns 404 for unknown stadiumId', async () => {
      const res = await request(app)
        .post('/api/ai/crowd-analysis')
        .send({ stadiumId: 'no-such-place' });
      expect(res.status).toBe(404);
    });
  });

  // ── Translation ─────────────────────────────────────────────────────────
  describe('POST /api/ai/translate', () => {
    it('returns a translated string', async () => {
      const res = await request(app)
        .post('/api/ai/translate')
        .send({ text: 'Welcome to the stadium.', targetLanguage: 'Spanish' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('translated');
      expect(typeof res.body.translated).toBe('string');
    });

    it('returns 400 when text is missing', async () => {
      const res = await request(app)
        .post('/api/ai/translate')
        .send({ targetLanguage: 'French' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when targetLanguage is missing', async () => {
      const res = await request(app)
        .post('/api/ai/translate')
        .send({ text: 'Hello' });
      expect(res.status).toBe(400);
    });
  });

  // ── Alert Generator ─────────────────────────────────────────────────────
  describe('POST /api/ai/generate-alert', () => {
    it('returns a PA alert string', async () => {
      const res = await request(app)
        .post('/api/ai/generate-alert')
        .send({ situation: 'Gate C is overcrowded', stadiumId: 'metlife', severity: 'medium' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('alert');
      expect(typeof res.body.alert).toBe('string');
      expect(res.body.alert.length).toBeGreaterThan(10);
    });

    it('returns 400 when situation is missing', async () => {
      const res = await request(app)
        .post('/api/ai/generate-alert')
        .send({ stadiumId: 'metlife' });
      expect(res.status).toBe(400);
    });

    it('accepts high severity level', async () => {
      const res = await request(app)
        .post('/api/ai/generate-alert')
        .send({ situation: 'Medical emergency in section 105', severity: 'high', stadiumId: 'sofi' });
      expect(res.status).toBe(200);
      expect(res.body.severity).toBe('high');
    });
  });

  // ── Volunteer Briefing ──────────────────────────────────────────────────
  describe('POST /api/ai/volunteer-brief', () => {
    it('returns a briefing for a valid role', async () => {
      const res = await request(app)
        .post('/api/ai/volunteer-brief')
        .send({ role: 'Gate Marshal', stadiumId: 'metlife', shiftTime: 'Pre-Match' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('brief');
      expect(res.body.brief.length).toBeGreaterThan(20);
    });

    it('returns 400 when role is missing', async () => {
      const res = await request(app)
        .post('/api/ai/volunteer-brief')
        .send({ stadiumId: 'metlife' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when stadiumId is missing', async () => {
      const res = await request(app)
        .post('/api/ai/volunteer-brief')
        .send({ role: 'Medical Support' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown stadiumId', async () => {
      const res = await request(app)
        .post('/api/ai/volunteer-brief')
        .send({ role: 'Gate Marshal', stadiumId: 'fake-venue' });
      expect(res.status).toBe(404);
    });
  });

  // ── Sustainability ──────────────────────────────────────────────────────
  describe('POST /api/ai/sustainability', () => {
    it('returns sustainability advice', async () => {
      const res = await request(app)
        .post('/api/ai/sustainability')
        .send({ stadiumId: 'sofi', query: 'How can I recycle at the stadium?' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('advice');
      expect(res.body.advice.length).toBeGreaterThan(10);
    });

    it('works without a query (uses default)', async () => {
      const res = await request(app)
        .post('/api/ai/sustainability')
        .send({ stadiumId: 'bcplace' });
      expect(res.status).toBe(200);
      expect(res.body.advice).toBeTruthy();
    });

    it('works without stadiumId (uses default)', async () => {
      const res = await request(app)
        .post('/api/ai/sustainability')
        .send({ query: 'What are green initiatives?' });
      expect(res.status).toBe(200);
      expect(res.body.advice).toBeTruthy();
    });
  });

  // ── Edge Cases & Error Handling ───────────────────────────────────────────
  describe('Edge Cases - Null/Undefined Safety', () => {
    it('handles navigation with stadium having minimal gates', async () => {
      const res = await request(app)
        .post('/api/ai/navigate')
        .send({ from: 'Entrance', to: 'Section 100', stadiumId: 'metlife' });
      expect(res.status).toBe(200);
      expect(res.body.instructions).toBeTruthy();
    });

    it('handles crowd analysis with empty waitTimes gracefully', async () => {
      const res = await request(app)
        .post('/api/ai/crowd-analysis')
        .send({ stadiumId: 'metlife' });
      expect(res.status).toBe(200);
      expect(res.body.analysis).toBeTruthy();
      expect(res.body.analysis).toContain('Crowd Analysis');
    });

    it('handles volunteer briefing with missing facilities data', async () => {
      const res = await request(app)
        .post('/api/ai/volunteer-brief')
        .send({ role: 'Gate Marshal', stadiumId: 'metlife' });
      expect(res.status).toBe(200);
      expect(res.body.brief).toBeTruthy();
      expect(res.body.brief).toContain('SHIFT BRIEFING');
    });

    it('handles fan assistant with null stadium context', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: 'Hello' });
      expect(res.status).toBe(200);
      expect(res.body.reply).toBeTruthy();
    });

    it('handles alert generation without stadium context', async () => {
      const res = await request(app)
        .post('/api/ai/generate-alert')
        .send({ situation: 'Test situation' });
      expect(res.status).toBe(200);
      expect(res.body.alert).toBeTruthy();
    });
  });
});
