/**
 * Tests: middleware/validate.js and middleware/errorHandler.js
 */

const express  = require('express');
const request  = require('supertest');
const { requireFields, requireStadium, optionalStadium, sanitizeHistory } = require('../../src/middleware/validate');
const { asyncHandler, globalError, notFound } = require('../../src/middleware/errorHandler');

// ── Helper: build a minimal Express app with given middleware + handler ──
function makeApp(middleware, handler) {
  const app = express();
  app.use(express.json());
  app.post('/test', ...middleware, handler || ((req, res) => res.json({ ok: true, body: req.body })));
  app.use(notFound);
  app.use(globalError);
  return app;
}

// ── requireFields ────────────────────────────────────────────────────────
describe('requireFields middleware', () => {
  it('passes when all required fields are present', async () => {
    const app = makeApp([requireFields(['name', 'email'])]);
    const res = await request(app).post('/test').send({ name: 'Alice', email: 'a@b.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 when a single field is missing', async () => {
    const app = makeApp([requireFields(['name', 'email'])]);
    const res = await request(app).post('/test').send({ name: 'Alice' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('returns 400 when field is empty string', async () => {
    const app = makeApp([requireFields(['message'])]);
    const res = await request(app).post('/test').send({ message: '' });
    expect(res.status).toBe(400);
  });

  it('lists multiple missing fields in the error', async () => {
    const app = makeApp([requireFields(['a', 'b', 'c'])]);
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/a.*b.*c|Missing required fields/i);
  });
});

// ── requireStadium ───────────────────────────────────────────────────────
describe('requireStadium middleware', () => {
  it('attaches req.stadium for a valid stadiumId', async () => {
    const app = makeApp(
      [requireStadium],
      (req, res) => res.json({ name: req.stadium.name })
    );
    const res = await request(app).post('/test').send({ stadiumId: 'metlife' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('MetLife Stadium');
  });

  it('returns 400 when stadiumId is missing', async () => {
    const app = makeApp([requireStadium]);
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown stadiumId', async () => {
    const app = makeApp([requireStadium]);
    const res = await request(app).post('/test').send({ stadiumId: 'unknown-xyz' });
    expect(res.status).toBe(404);
  });
});

// ── optionalStadium ──────────────────────────────────────────────────────
describe('optionalStadium middleware', () => {
  it('attaches req.stadium when stadiumId is valid', async () => {
    const app = makeApp(
      [optionalStadium],
      (req, res) => res.json({ found: !!req.stadium })
    );
    const res = await request(app).post('/test').send({ stadiumId: 'sofi' });
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
  });

  it('sets req.stadium to null when stadiumId is absent', async () => {
    const app = makeApp(
      [optionalStadium],
      (req, res) => res.json({ found: req.stadium })
    );
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(200);
    expect(res.body.found).toBeNull();
  });

  it('sets req.stadium to null for unknown stadiumId', async () => {
    const app = makeApp(
      [optionalStadium],
      (req, res) => res.json({ found: req.stadium })
    );
    const res = await request(app).post('/test').send({ stadiumId: 'fake' });
    expect(res.status).toBe(200);
    expect(res.body.found).toBeNull();
  });
});

// ── sanitizeHistory ──────────────────────────────────────────────────────
describe('sanitizeHistory middleware', () => {
  it('passes through a valid history array', async () => {
    const app = makeApp(
      [sanitizeHistory(10)],
      (req, res) => res.json({ history: req.body.conversationHistory })
    );
    const history = [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi' }];
    const res = await request(app).post('/test').send({ conversationHistory: history });
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(2);
  });

  it('sets history to [] when not an array', async () => {
    const app = makeApp(
      [sanitizeHistory(10)],
      (req, res) => res.json({ history: req.body.conversationHistory })
    );
    const res = await request(app).post('/test').send({ conversationHistory: 'invalid' });
    expect(res.status).toBe(200);
    expect(res.body.history).toEqual([]);
  });

  it('caps history to maxTurns', async () => {
    const app = makeApp(
      [sanitizeHistory(3)],
      (req, res) => res.json({ history: req.body.conversationHistory })
    );
    const history = Array.from({ length: 10 }, (_, i) => ({ role: 'user', content: `msg ${i}` }));
    const res = await request(app).post('/test').send({ conversationHistory: history });
    expect(res.body.history).toHaveLength(3);
  });

  it('strips unknown fields from each message', async () => {
    const app = makeApp(
      [sanitizeHistory(10)],
      (req, res) => res.json({ history: req.body.conversationHistory })
    );
    const history = [{ role: 'user', content: 'hello', malicious: 'data', extra: 123 }];
    const res = await request(app).post('/test').send({ conversationHistory: history });
    expect(res.body.history[0]).not.toHaveProperty('malicious');
    expect(res.body.history[0]).not.toHaveProperty('extra');
    expect(res.body.history[0]).toHaveProperty('role');
    expect(res.body.history[0]).toHaveProperty('content');
  });
});

// ── asyncHandler ─────────────────────────────────────────────────────────
describe('asyncHandler middleware', () => {
  it('forwards thrown errors to globalError', async () => {
    const app = express();
    app.use(express.json());
    app.get('/boom', asyncHandler(async () => {
      throw new Error('Test error');
    }));
    app.use(globalError);

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('forwards 4xx errors with correct status', async () => {
    const app = express();
    app.use(express.json());
    app.get('/notfound', asyncHandler(async () => {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }));
    app.use(globalError);

    const res = await request(app).get('/notfound');
    expect(res.status).toBe(404);
  });
});

// ── notFound ─────────────────────────────────────────────────────────────
describe('notFound middleware', () => {
  it('returns 404 with method and path', async () => {
    const app = express();
    app.use(notFound);
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/GET.*does-not-exist/i);
  });
});
