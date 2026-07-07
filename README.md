# ⚽ StadiumAI — FIFA World Cup 2026 GenAI Platform

A full-stack Generative AI platform enhancing stadium operations and fan experience for FIFA World Cup 2026, hosted across the USA, Canada, and Mexico.

Built with **React + Vite** frontend and **Node.js/Express** backend, deployable as a single app on **Vercel**.

---

## 🎯 What It Does

| Feature | Description |
|---|---|
| 🤖 **AI Chatbot (Julep)** | Persistent-session chatbot with smart rule-based engine + optional GPT upgrade |
| 💬 **Fan Assistant** | Multilingual AI chatbot for navigation, FAQs, accessibility, and real-time stadium help |
| 🗺️ **AI Navigation** | Step-by-step indoor routing with crowd-aware, accessible path options |
| 👥 **Crowd Intelligence** | Real-time occupancy, hotspot detection, gate wait times + AI operational analysis |
| 🌐 **Multilingual Translator** | Instant translation of announcements and signs into 20+ languages |
| ⚡ **Smart Transport Advisor** | AI-powered sustainable transport recommendations based on origin, group size, and timing |
| 🌿 **Sustainability Advisor** | Eco-tips, green transport, recycling info, and carbon footprint guidance |
| 🔔 **PA Alert Generator** | AI-generated public address announcements for any situation, any language |
| 📋 **Volunteer Briefings** | Role-specific AI shift briefings for 10 volunteer types, in any language |

---

## 🏟️ Supported Venues

- 🇺🇸 MetLife Stadium — East Rutherford, NJ
- 🇺🇸 AT&T Stadium — Arlington, TX
- 🇺🇸 SoFi Stadium — Inglewood, CA
- 🇲🇽 Estadio Azteca — Mexico City
- 🇨🇦 BC Place — Vancouver

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- (Optional) OpenAI API key — the app works fully without one using the built-in smart engine

### 1. Install Dependencies

```bash
# Install all dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# (Optional) Edit .env and add your OPENAI_API_KEY for GPT-powered responses
```

### 3. Run Locally

```bash
# Terminal 1 — Backend (port 3001)
cd backend
node src/server.js

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## ☁️ Deploy on Vercel

This project is configured for **single-app Vercel deployment** — no separate backend hosting needed.

### Steps

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects `vercel.json` — no config needed
4. (Optional) Add `OPENAI_API_KEY` in **Settings → Environment Variables**
5. Click **Deploy** ✅

### How It Works

- **Frontend**: Vite builds static files → served from `frontend/dist/`
- **Backend**: Express app runs as a Vercel Serverless Function via `api/index.js`
- **Routing**: `vercel.json` routes `/api/*` → serverless function, everything else → frontend

---

## 🏗️ Architecture

```
StadiumAI/
├── api/
│   └── index.js                # Vercel serverless entry point
├── backend/
│   ├── src/
│   │   ├── server.js           # Express app + middleware
│   │   ├── routes/
│   │   │   ├── ai.js           # All GenAI endpoints (7 AI features)
│   │   │   ├── chatbot.js      # Julep-powered chatbot (session-based)
│   │   │   ├── stadium.js      # Stadium data endpoints
│   │   │   ├── crowd.js        # Crowd occupancy endpoints
│   │   │   └── transport.js    # Transport endpoints
│   │   ├── services/
│   │   │   ├── openaiService.js  # OpenAI wrapper with graceful fallback
│   │   │   └── julepService.js   # Smart rule-based AI engine
│   │   └── data/
│   │       └── stadiums.js     # Stadium, crowd, and match data
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main app shell, routing, stadium selector
│   │   ├── api/client.js       # Axios API client
│   │   └── components/
│   │       ├── JulepChatbot.jsx      # AI chatbot with session memory
│   │       ├── FanAssistant.jsx      # Fan assistant chatbot
│   │       ├── NavigationTool.jsx    # Indoor navigation
│   │       ├── CrowdDashboard.jsx    # Crowd ops + AI analysis
│   │       ├── TranslationTool.jsx   # 20+ language translation
│   │       ├── TransportAdvisor.jsx  # Smart transport recs
│   │       ├── SustainabilityPanel.jsx
│   │       ├── AlertGenerator.jsx    # PA announcement generator
│   │       └── VolunteerBriefing.jsx # Shift briefing generator
│   └── package.json
│
├── vercel.json                 # Vercel deployment config
└── package.json                # Root dependencies
```

---

## 🧠 GenAI Features Detail

### AI Chatbot (Julep)
- Session-based memory across conversations
- Smart rule-based engine handles 12+ intent categories
- Auto-upgrades to GPT-4o-mini if OpenAI key is provided
- Floating widget available on all pages

### Fan Assistant
- Multi-turn conversation memory
- Responds in any of 12 languages
- Crowd-aware (knows current hotspots)
- Context-loaded with full stadium data

### Crowd Intelligence
- Visual occupancy bars per venue
- Color-coded gate wait times (green/yellow/red)
- AI analysis: risk level, staff recommendations, fan advisories, 30-min forecast

### Navigation
- Crowd-avoidance routing (routes around hotspots)
- Accessibility mode (lifts only, accessible entrances)
- Multi-language output
- Quick-route presets for common destinations

### PA Alert Generator
- Three severity levels (informational/advisory/urgent)
- Preset scenarios (congestion, medical, weather, fire)
- Download/copy functionality
- Alert history log

---

## 🔌 API Endpoints

```
POST /api/chatbot/message       # Julep chatbot (session-based)
POST /api/chatbot/reset         # Clear chatbot session
GET  /api/chatbot/status        # AI engine status

POST /api/ai/fan-assistant      # Multi-turn AI chat
POST /api/ai/navigate           # Indoor navigation directions
POST /api/ai/crowd-analysis     # Crowd intelligence report
POST /api/ai/translate          # Multilingual translation
POST /api/ai/sustainability     # Eco advice
POST /api/ai/generate-alert     # PA announcement
POST /api/ai/volunteer-brief    # Shift briefing

POST /api/transport/recommend   # Transport recommendation
GET  /api/stadium               # All stadiums
GET  /api/crowd                 # All crowd data
GET  /health                    # Health check
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TailwindCSS 3, Lucide Icons |
| Backend | Node.js, Express 4, OpenAI SDK |
| AI Engine | GPT-4o-mini (optional) + Built-in Smart Engine |
| Deployment | Vercel (Serverless Functions + Static) |

---

## 🛡️ Security
- Rate limiting (60 req/min)
- CORS restricted to known origins
- Helmet.js security headers
- Input validation on all endpoints

---

## 📄 License

Built for FIFA World Cup 2026 — Generative AI Platform Demo.
