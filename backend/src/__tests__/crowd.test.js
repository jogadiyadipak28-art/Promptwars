/**
 * Tests: GET /api/crowd  — crowd data routes
 */

'use strict';

const request = require('supertest');
const app     = require('../../src/server');

describe('Crowd Routes', () => {

  describe('GET /api/crowd', () => {
    it('returns crowd data for all stadiums', async () => {
      const res = await request(app).get('/api/crowd');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('each entry includes occupancyPct, currentOccupancy, capacity', async () => {
      const res = await request(app).get('/api/crowd');
      for (const venue of res.body) {
        expect(venue).toHaveProperty('id');
        expect(venue).toHaveProperty('occupancyPct');
        expect(venue).toHaveProperty('currentOccupancy');
        expect(venue).toHaveProperty('capacity');
        expect(venue.occupancyPct).toBeGreaterThan(0);
        expect(venue.occupancyPct).toBeLessThanOrEqual(100);
      }
    });

    it('each entry includes hotspots and waitTimes', async () => {
      const res = await request(app).get('/api/crowd');
      for (const venue of res.body) {
        expect(venue).toHaveProperty('hotspots');
        expect(venue).toHaveProperty('waitTimes');
        expect(Array.isArray(venue.hotspots)).toBe(true);
        expect(typeof venue.waitTimes).toBe('object');
      }
    });
  });

  describe('GET /api/crowd/:stadiumId', () => {
    it('returns crowd data for metlife', async () => {
      const res = await request(app).get('/api/crowd/metlife');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('metlife');
      expect(res.body).toHaveProperty('occupancyPct');
    });

    it('occupancyPct is calculated correctly', async () => {
      const res = await request(app).get('/api/crowd/metlife');
      const { currentOccupancy, capacity, occupancyPct } = res.body;
      const expected = Math.round((currentOccupancy / capacity) * 100);
      expect(occupancyPct).toBe(expected);
    });

    it('returns 404 for unknown stadium', async () => {
      const res = await request(app).get('/api/crowd/nonexistent-99');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('returns crowd data for azteca', async () => {
      const res = await request(app).get('/api/crowd/azteca');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('waitTimes');
    });
  });
});
