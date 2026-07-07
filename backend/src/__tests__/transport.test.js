/**
 * Tests: Transport routes — GET and POST /api/transport
 */

const request = require('supertest');
const app     = require('../../src/server');

describe('Transport Routes', () => {

  describe('GET /api/transport/:stadiumId', () => {
    it('returns transport options for metlife', async () => {
      const res = await request(app).get('/api/transport/metlife');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stadium');
      expect(res.body).toHaveProperty('transport');
    });

    it('transport object has subway, bus, parking, rideshare', async () => {
      const res = await request(app).get('/api/transport/sofi');
      expect(res.body.transport).toHaveProperty('subway');
      expect(res.body.transport).toHaveProperty('bus');
      expect(res.body.transport).toHaveProperty('parking');
      expect(res.body.transport).toHaveProperty('rideshare');
    });

    it('returns 404 for unknown stadium', async () => {
      const res = await request(app).get('/api/transport/fake-stadium');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/transport/recommend', () => {
    it('returns a recommendation for a valid request', async () => {
      const res = await request(app)
        .post('/api/transport/recommend')
        .send({ stadiumId: 'metlife', origin: 'Times Square, New York' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recommendation');
      expect(typeof res.body.recommendation).toBe('string');
      expect(res.body.recommendation.length).toBeGreaterThan(20);
    });

    it('returns 400 when stadiumId is missing', async () => {
      const res = await request(app)
        .post('/api/transport/recommend')
        .send({ origin: 'Downtown Hotel' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when origin is missing', async () => {
      const res = await request(app)
        .post('/api/transport/recommend')
        .send({ stadiumId: 'metlife' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 404 for unknown stadiumId', async () => {
      const res = await request(app)
        .post('/api/transport/recommend')
        .send({ stadiumId: 'unknown-venue', origin: 'Airport' });
      expect(res.status).toBe(404);
    });

    it('falls back gracefully without OpenAI (smart engine)', async () => {
      const res = await request(app)
        .post('/api/transport/recommend')
        .send({ stadiumId: 'azteca', origin: 'Mexico City Centre', groupSize: 4 });

      expect(res.status).toBe(200);
      expect(res.body.recommendation).toBeTruthy();
    });
  });
});
