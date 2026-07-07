import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// AI endpoints
export const fanAssistant = (data) => api.post('/ai/fan-assistant', data);
export const navigate = (data) => api.post('/ai/navigate', data);
export const crowdAnalysis = (data) => api.post('/ai/crowd-analysis', data);
export const translate = (data) => api.post('/ai/translate', data);
export const sustainabilityAdvice = (data) => api.post('/ai/sustainability', data);
export const generateAlert = (data) => api.post('/ai/generate-alert', data);
export const volunteerBrief = (data) => api.post('/ai/volunteer-brief', data);
export const transportRecommend = (data) => api.post('/transport/recommend', data);

// Julep-powered chatbot endpoints
export const chatbotMessage = (data) => api.post('/chatbot/message', data);
export const chatbotReset = (data) => api.post('/chatbot/reset', data);
export const chatbotStatus = () => api.get('/chatbot/status');

// Data endpoints
export const getStadiums = () => api.get('/stadium');
export const getStadium = (id) => api.get(`/stadium/${id}`);
export const getCrowdData = () => api.get('/crowd');
export const getCrowdDataForStadium = (id) => api.get(`/crowd/${id}`);
export const getTransport = (id) => api.get(`/transport/${id}`);

export default api;
