// Vercel Serverless Function — wraps the Express backend
// All /api/* requests are routed here by vercel.json
const app = require('../backend/src/server');

module.exports = app;
