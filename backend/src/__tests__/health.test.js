/**
 * Tests: Health check and 404 handling
 */

'use strict';

const request = require('supertest');
const app     = require('../../src/server');

describe('Server', () => {
  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('404 handler', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
