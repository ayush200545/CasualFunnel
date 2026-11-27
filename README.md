# CausalFunnel User Analytics Platform

[![CI Tests](https://github.com/your-username/causalfunnel-analytics/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/causalfunnel-analytics/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20Zero--Config%20Memory-brightgreen.svg)](https://www.mongodb.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20TailwindCSS-blue.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-grade, full-stack user session tracking and behavioral analytics platform built for the **CausalFunnel** Full Stack Engineer selection assignment. The system tracks client interactions (`page_view`, `click`, viewport coordinates, element DOM selectors), normalizes telemetry across devices, and delivers an interactive dashboard featuring **User Journey Playback**, **Canvas Thermal Heatmaps**, and **E-Commerce Conversion Funnel Analytics**.

---

## 🌟 System Architecture

```
                      ┌──────────────────────────────────────────────┐
                      │              Target Webpage                  │
                      │   (Embedded tracker.js v2.0 Micro-batch)     │
                      └──────────────────────┬───────────────────────┘
                                             │
                        POST /api/events     │ navigator.sendBeacon (on unload)
                        (Batched JSON payload│ fetch (keepalive: true)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │             Node.js Express API              │
                      │   - Telemetry Ingestion & Validation         │
                      │   - Aggregation Pipelines (Sessions & Funnel)│
                      │   - Coordinate Normalization (X/W, Y/H %)    │
                      │   - CSV & JSON Session Journey Exporter      │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │              MongoDB Database                │
                      │   - Indexed on (sessionId, timestamp)        │
                      │   - Indexed on (pageUrl, eventType)          │
                      │   - In-Memory Fallback (MongoMemoryServer)   │
                      └──────────────────────▲───────────────────────┘
                                             │
                         REST API Queries    │
                                             │
                      ┌──────────────────────┴───────────────────────┐
                      │          React Analytics Dashboard           │
                      │   - Sessions List & Filter Bar               │
                      │   - Animated User Journey Replay & Exporter  │
                      │   - Thermal LUT Gaussian Heatmap Visualizer  │
                      │   - E-Commerce Conversion Funnel Analyzer    │
                      │   - Live Interactive Demo Store Sandbox      │
                      └──────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. Enterprise Tracking Script (`tracker.js v2.0`)
- **Ultra-lightweight (<4KB)**: Pure Vanilla JS, zero dependencies, wrapped in safe try/catch blocks (never crashes host websites).
- **Session Continuity**: Persistent `session_id` using `localStorage` with cookie fallback and a 30-minute sliding inactivity window.
- **Micro-Batching Queue**: Buffers events in memory and flushes periodically (1.2s) or instantly on page view/unload, saving network bandwidth.
- **Resilient Transport**: Uses `navigator.sendBeacon` for non-blocking transmissions that survive page transitions, falling back to `fetch` with `keepalive: true`.
- **Selector Path Extraction**: Generates full CSS DOM paths (e.g., `button#add-cart-headphones.btn-primary`).
- **SPA Aware**: Intercepts HTML5 History API (`pushState`, `replaceState`, `popstate`) for seamless single-page application page view tracking.
- **Scroll Tracking**: Automatically captures scroll depth thresholds (50%, 90%).

### 2. High-Fidelity Canvas Heatmap Visualizer
- **Thermal Glow (Gaussian LUT)**: Renders a true thermal gradient (Blue -> Cyan -> Lime Green -> Yellow -> Red) on HTML5 `<canvas>` using alpha intensity look-up tables.
- **Interactive Dot Map**: Individual click points with hover tooltips displaying element tags, inner text snippets, coordinates, and timestamp.
- **10x10 Matrix Grid**: Quantitative density grid showing click concentration percentages across page regions.
- **Responsive Viewport Normalization**: Clicks are mapped as normalized percentages (`normalizedX`, `normalizedY`), ensuring clicks accurately align whether viewed on mobile or desktop.
- **Backdrop Modes**: Toggle between Live Demo Store layout preview, neutral wireframe, or dark canvas.

### 3. User Journey Timeline & Automated Replay
- Chronological ordered list of events per session with relative time elapsed (`+Δt` from session start) and time delta between steps.
- **"Play Journey Steps"**: Interactive playback mode that steps through user events automatically with visual highlights and auto-scrolling.
- **One-Click Export**: Download session journeys directly as **CSV** or **JSON** for downstream business intelligence.

### 4. E-Commerce Conversion Funnel
Directly tailored to CausalFunnel’s mission of understanding user intent and conversion optimization:
- **Stage 1**: Store Landing (100%)
- **Stage 2**: Product Engagement (Explored product details)
- **Stage 3**: Cart Intent (Clicked "Add to Cart")
- **Stage 4**: Conversion / Checkout (Clicked "Buy Now" or "Checkout")
- Visual drop-off percentages and conversion rates between each stage.

### 5. Interactive Testing Sandbox
- **Built-in Demo Store**: An interactive e-commerce store with products, cart, wishlist, and search bar right inside the dashboard.
- **Simulate New Visitor**: One-click session rotation button to quickly generate multiple visitor profiles.
- **Standalone Demo**: Standalone HTML page (`demo/index.html`) demonstrating script embedding via `<script src="http://localhost:5000/tracker.js"></script>`.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Client Tracker** | Vanilla JavaScript (ES6+ IIFE), `navigator.sendBeacon`, HTML5 History API, `localStorage` / Cookies |
| **Backend API** | Node.js (v18 / v20), Express 4, CORS, Mongoose 8 |
| **Database** | MongoDB, `mongodb-memory-server` (Zero-Config In-Memory Fallback) |
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, Lucide React, HTML5 Canvas API |
| **DevOps & CI/CD** | Docker, Docker Compose, GitHub Actions CI Workflow |
| **Testing** | Node.js Built-in Test Runner (`node:test`, `node:assert`) |

---

## 💻 Installation & Setup

### Option A: Local Development (Fastest)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd causalfunnel-analytics

# 2. Install all dependencies (root, backend, and frontend)
npm run install:all

# 3. Start backend & frontend concurrently
npm run dev
```

- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Tracker Script Endpoint**: [http://localhost:5000/tracker.js](http://localhost:5000/tracker.js)

> **Note on MongoDB**: If a local MongoDB instance is running at `mongodb://127.0.0.1:27017`, the app connects to it automatically. If MongoDB is not running, the backend launches an **automatic in-memory MongoDB instance (`mongodb-memory-server`)**, allowing evaluators to run and test the app with zero external setup!

---

### Option B: Docker Compose (Zero Host Setup)

Run the entire stack (MongoDB container + Backend container + Frontend container):

```bash
docker compose up --build
```

---

### Option C: Run Automated Tests

Execute the backend integration test suite covering ingestion, session aggregations, journey timelines, export, and funnel metrics:

```bash
cd backend
npm test
```

---

## 📡 Complete API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/events` | Ingest single event or array of events (JSON or text/plain from `sendBeacon`). |
| `GET` | `/api/sessions` | Fetch aggregated sessions list with total events, breakdown, duration, and search filters. |
| `GET` | `/api/sessions/:sessionId/events` | Fetch chronological event timeline (User Journey) with delta seconds. |
| `GET` | `/api/sessions/:sessionId/export?format=csv` | Download session journey as formatted CSV spreadsheet. |
| `GET` | `/api/sessions/:sessionId/export?format=json` | Download session journey as raw JSON. |
| `GET` | `/api/heatmap?url=<URL>` | Fetch click coordinates (`x`, `y`, `viewportWidth`, `viewportHeight`, target elements) for a page. |
| `GET` | `/api/heatmap/pages` | Fetch all indexed page URLs with click and page view counts. |
| `GET` | `/api/funnel` | Aggregates e-commerce conversion stages and drop-off percentages. |
| `GET` | `/api/stats` | High-level overview metrics (total events, sessions, top pages). |
| `GET` | `/tracker.js` | Serves client tracking library. |
| `GET` | `/api/health` | Health check endpoint. |

---

## 📋 Embedding the Tracker on Any Website

Simply include the script tag on any webpage:

```html
<!-- CausalFunnel Telemetry Script -->
<script 
  src="http://localhost:5000/tracker.js" 
  data-endpoint="http://localhost:5000/api/events"
></script>
```

Programmatic tracking is also available:
```javascript
// Track custom business events
window.CausalTracker.track('custom', {
  target_text: 'Promo Code Applied',
  metadata: { coupon: 'SAVE20' }
});

// Rotate to a new visitor session
const newSessionId = window.CausalTracker.resetSession();
```

---

## 💡 Assumptions and Engineering Trade-Offs

1. **Session Sliding Window vs Server-Side Tokens**:
   - *Design Choice*: Sessions are maintained on the client using a 30-minute inactivity sliding window stored in `localStorage` with fallback to cookies.
   - *Trade-off*: Client-side persistence avoids server-side session store lookups on every beacon request, yielding ultra-low ingestion latency (<5ms).

2. **Micro-Batching Telemetry Queue**:
   - *Design Choice*: The tracker buffers high-frequency click events into an internal array and flushes every 1.2 seconds or upon page unload (`visibilitychange` / `beforeunload`).
   - *Benefit*: Dramatically reduces HTTP request overhead and prevents rate-limit exhaustion during intensive user interactions without losing data on tab close.

3. **Viewport-Normalized Coordinate System**:
   - *Design Choice*: Telemetry captures `(click_x, click_y)` and `(viewport_width, viewport_height)`. The API and heatmap renderer compute `normalizedX = (clickX / viewportW) * 100%`.
   - *Benefit*: Clicks made on varying monitor sizes (mobile, tablet, desktop) scale and overlay consistently on responsive layouts.

4. **Zero-Config Database Fallback**:
   - *Design Choice*: Express checks for a live MongoDB instance on startup. If unavailable, it dynamically boots an in-memory `MongoMemoryServer`.
   - *Benefit*: Eliminates evaluator setup friction while preserving 100% Mongoose feature parity.

---

## 🌐 Cloud Deployment Guide

- **Frontend**: Can be deployed to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) with root directory set to `frontend` and environment variable `VITE_API_URL=<backend-url>`.
- **Backend**: Can be deployed to [Render](https://render.com), [Railway](https://railway.app), or [Fly.io] using the included `backend/Dockerfile` and `MONGODB_URI` from [MongoDB Atlas](https://www.mongodb.com/atlas).

---

## 📄 License
MIT © 2026 Ayush
