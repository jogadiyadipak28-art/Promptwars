/**
 * server.js
 *
 * Express application entry point for the FIFA WC 2026 StadiumAI API.
 * Configures security middleware, rate limiting, routing, and error handling.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const aiRouter       = require('./routes/ai');
const stadiumRouter  = require('./routes/stadium');
const crowdRouter    = require('./routes/crowd');
const transportRouter = require('./routes/transport');
const chatbotRouter  = require('./routes/chatbot');
const { globalError, notFound } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security & parsing middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.VERCEL
    ? true  // same-origin on Vercel
    : ['http://localhost:5173', 'http://localhost:3000'],
}));
app.use(express.json({ limit: '50kb' })); // prevent oversized payloads
app.use(morgan(process.env.NODE_ENV === 'test' ? 'dev' : 'combined'));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again shortly.' },
});
app.use('/api/', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/ai',        aiRouter);
app.use('/api/stadium',   stadiumRouter);
app.use('/api/crowd',     crowdRouter);
app.use('/api/transport', transportRouter);
app.use('/api/chatbot',   chatbotRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Error handling (order matters — notFound before globalError) ──────────────
app.use(notFound);
app.use(globalError);

// ── Start server (not in test or serverless environments) ─────────────────────
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () =>
    console.log(`FIFA WC 2026 API running on http://localhost:${PORT}`)
  );
}

module.exports = app;
