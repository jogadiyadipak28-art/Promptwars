/**
 * api/client.js
 *
 * Centralised Axios instance and typed API call wrappers for the
 * FIFA WC 2026 StadiumAI backend.
 *
 * All functions return an Axios response promise. Callers should
 * handle errors with try/catch or .catch().
 */

import axios from 'axios';

/** Shared Axios instance — all API calls go through this */
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Response interceptor — logs non-network errors in development so
 * the console gives useful context without exposing details in production.
 */
api.interceptors.response.use(
  response => response,
  error => {
    if (import.meta.env.DEV) {
      const status  = error.response?.status;
      const url     = error.config?.url;
      console.warn(`[API] ${status ?? 'Network error'} on ${url}`);
    }
    return Promise.reject(error);
  }
);

// ── AI endpoints ──────────────────────────────────────────────────────────────

/** @param {{ message: string, language?: string, stadiumId?: string, conversationHistory?: Array }} data */
export const fanAssistant        = (data) => api.post('/ai/fan-assistant', data);

/** @param {{ from: string, to: string, stadiumId: string, accessibility?: boolean, language?: string }} data */
export const navigate            = (data) => api.post('/ai/navigate', data);

/** @param {{ stadiumId: string }} data */
export const crowdAnalysis       = (data) => api.post('/ai/crowd-analysis', data);

/** @param {{ text: string, targetLanguage: string }} data */
export const translate           = (data) => api.post('/ai/translate', data);

/** @param {{ stadiumId?: string, query?: string }} data */
export const sustainabilityAdvice = (data) => api.post('/ai/sustainability', data);

/** @param {{ situation: string, stadiumId?: string, severity?: string, language?: string }} data */
export const generateAlert       = (data) => api.post('/ai/generate-alert', data);

/** @param {{ role: string, stadiumId: string, shiftTime?: string, language?: string }} data */
export const volunteerBrief      = (data) => api.post('/ai/volunteer-brief', data);

/** @param {{ stadiumId: string, origin: string, arrivalTime?: string, groupSize?: number }} data */
export const transportRecommend  = (data) => api.post('/transport/recommend', data);

// ── Chatbot endpoints ─────────────────────────────────────────────────────────

/** @param {{ message: string, sessionId?: string, stadiumId?: string, language?: string }} data */
export const chatbotMessage = (data) => api.post('/chatbot/message', data);

/** @param {{ sessionId: string }} data */
export const chatbotReset   = (data) => api.post('/chatbot/reset', data);

/** Returns current AI engine status */
export const chatbotStatus  = ()     => api.get('/chatbot/status');

// ── Data endpoints ────────────────────────────────────────────────────────────

/** Returns all stadiums */
export const getStadiums            = ()    => api.get('/stadium');

/** @param {string} id - Stadium ID */
export const getStadium             = (id)  => api.get(`/stadium/${id}`);

/** Returns crowd data for all stadiums */
export const getCrowdData           = ()    => api.get('/crowd');

/** @param {string} id - Stadium ID */
export const getCrowdDataForStadium = (id)  => api.get(`/crowd/${id}`);

/** @param {string} id - Stadium ID */
export const getTransport           = (id)  => api.get(`/transport/${id}`);

export default api;
