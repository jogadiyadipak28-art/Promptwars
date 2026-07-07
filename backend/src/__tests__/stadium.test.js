/**
 * Tests: GET /api/stadium  — stadium data routes
 */

'use strict';

const request = require('supertest');
const app     = require('../../src/server');

describe('Stadium Routes', () => {

  describe('GET /api/stadium', () => {
    it('returns an array of stadiums', async () => {
      const res = await request(app).get('/api/stadium');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('each stadium has required fields', async () => {
      const res = await request(app).get('/api/stadium');
      for (const stadium of res.body) {
        expect(stadium).toHaveProperty('id');
        expect(stadium).toHaveProperty('name');
        expect(stadium).toHaveProperty('city');
        expect(stadium).toHaveProperty('capacity');
        expect(typeof stadium.capacity).toBe('number');
        expect(stadium.capacity).toBeGreaterThan(0);
      }
    });

    it('includes expected stadiums (metlife, atandt, sofi, azteca, bcplace)', async () => {
      const res  = await request(app).get('/api/stadium');
      const ids  = res.body.map(s => s.id);
      expect(ids).toContain('metlife');
      expect(ids).toContain('atandt');
      expect(ids).toContain('sofi');
      expect(ids).toContain('azteca');
      expect(ids).toContain('bcplace');
    });
  });

  describe('GET /api/stadium/:id', () => {
    it('returns a specific stadium by id', async () => {
      const res = await request(app).get('/api/stadium/metlife');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('metlife');
      expect(res.body.name).toBe('MetLife Stadium');
    });

    it('includes facilities and transportation', async () => {
      const res = await request(app).get('/api/stadium/metlife');
      expect(res.body).toHaveProperty('facilities');
      expect(res.body).toHaveProperty('transportation');
      expect(res.body.facilities).toHaveProperty('medicalStations');
      expect(res.body.facilities).toHaveProperty('accessibleEntrances');
    });

    it('returns 404 for unknown stadium id', async () => {
      const res = await request(app).get('/api/stadium/unknown-stadium-xyz');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/stadium/:id/matches', () => {
    it('returns matches for a given stadium', async () => {
      const res = await request(app).get('/api/stadium/metlife/matches');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('each match has home, away, date fields', async () => {
      const res = await request(app).get('/api/stadium/metlife/matches');
      for (const match of res.body) {
        expect(match).toHaveProperty('home');
        expect(match).toHaveProperty('away');
        expect(match).toHaveProperty('date');
      }
    });
  });
});
