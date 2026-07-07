const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const aiRouter = require('./routes/ai');
const stadiumRouter = require('./routes/stadium');
const crowdRouter = require('./routes/crowd');
const transportRouter = require('./routes/transport');
const chatbotRouter = require('./routes/chatbot');

const app = express();
const PORT = process.env.PORT || 3001;

// Security & middleware
app.use(helmet());
app.use(cors({
  origin: process.env.VERCEL
    ? true   // Allow same-origin on Vercel
    : ['http://localhost:5173', 'http://localhost:3000']
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again shortly.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/ai', aiRouter);
app.use('/api/stadium', stadiumRouter);
app.use('/api/crowd', crowdRouter);
app.use('/api/transport', transportRouter);
app.use('/api/chatbot', chatbotRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Only listen on a port in local development (not on Vercel serverless, not in tests)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`FIFA WC 2026 API running on http://localhost:${PORT}`));
}

module.exports = app;
