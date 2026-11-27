# CausalFunnel User Analytics Platform

A high-performance, full-stack user session tracking and behavioral analytics application. The application tracks client-side user interactions (`page_view`, `click`, viewport coordinates, target metadata) and provides an interactive dashboard with user session journeys, visual heatmap analysis, and a real-time testing sandbox.

---

## 🌟 Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │            Target Webpage                │
                      │  (Client with embedded tracker.js)       │
                      └────────────────────┬─────────────────────┘
                                           │
                        POST /api/events   │ (navigator.sendBeacon / fetch)
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │          Node.js Express API             │
                      │   - Ingestion & Session Aggregation      │
                      │   - Heatmap Coordinate Normalization     │
                      └────────────────────┬─────────────────────┘
                                           │
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │           MongoDB Database               │
                      │   - Indexed on (sessionId, timestamp)    │
                      │   - Zero-config in-memory fallback       │
                      └────────────────────▲─────────────────────┘
                                           │
                        REST API Queries   │
                                           │
                      ┌────────────────────┴─────────────────────┐
                      │         React Analytics Dashboard        │
                      │   - Sessions & User Journey Viewer       │
                      │   - Multi-mode Heatmap (Dots, Glow, Grid)│
                      │   - Interactive Demo Store Sandbox       │
                      └──────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

### 1. Client-Side Tracking (`tracker.js`)
- **Vanilla JavaScript (IIFE)**: Zero dependencies, lightweight (< 4KB), non-blocking.
- **Session Management**: Persistent `session_id` stored in `localStorage` with cookie fallback and 30-minute inactivity rolling timeout.
- **Telemetry Protocols**: Uses `navigator.sendBeacon` for non-blocking transport that survives page unloads, with fallback to `fetch` with `keepalive: true`.
- **SPA Support**: Automatically captures route changes via history API (`pushState`, `replaceState`, `popstate`).
- **Telemetry Payload**:
  - `session_id`
  - `event_type` (`page_view`, `click`)
  - `page_url` (full URL)
  - `timestamp` (ISO 8601)
  - `click_x` and `click_y` coordinates (page relative)
  - `viewport_width` and `viewport_height` (for responsive heatmap normalization)
  - Element context: `target_tag`, `target_id`, `target_class`, `target_text`.

### 2. Backend (Node.js & Express)
- **Node.js (v18+)** & **Express 4**
- **CORS & Body Parsers**: Ingests both JSON and `text/plain` payloads from `sendBeacon`.
- **Database Driver**: **Mongoose 8** with schema validation and compound indexing.
- **Resilient Fallback**: Automatic **`MongoMemoryServer`** fallback if local/cloud MongoDB is offline, enabling zero-friction evaluation.

### 3. Database (MongoDB)
- **Structured Event Schema**: Optimized for analytical queries.
- **Compound Indexes**:
  - `{ sessionId: 1, timestamp: 1 }` (Fast user journey retrieval)
  - `{ pageUrl: 1, eventType: 1 }` (Fast heatmap coordinate lookups)
  - `{ eventType: 1, timestamp: -1 }` (Macro metrics)

### 4. Dashboard (Frontend)
- **React 18** & **Vite 6** (Fast HMR and production build)
- **Tailwind CSS 3** (Modern responsive UI)
- **Lucide React** (Icons)
- **Features**:
  - **Sessions View**: Aggregated session list, total event counts, page breakdown, duration, and single-click copy.
  - **User Journey Viewer**: Chronological timeline of all events in a session with elapsed time offsets (`+Δt`), step numbers, and raw JSON inspection.
  - **Heatmap Visualizer**:
    - URL selector with click counts and page views.
    - **Dot Map View**: Responsive coordinate-mapped click points with hover tooltips (element tag, text, x/y).
    - **Glow / Density View**: Multi-layer radial heatmap gradient.
    - **10x10 Grid View**: Matrix density visualization.
    - Dot size and opacity controls.
  - **Live Demo Store Sandbox**: Built-in interactive e-commerce store with products, cart, wishlist, and immediate visual event tracking feedback.

---

## 🛠️ Setup & Running Locally

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9+ or higher)
- **MongoDB** (Optional: If local MongoDB is running at `mongodb://127.0.0.1:27017`, it connects automatically. If not, it gracefully launches an in-memory MongoDB instance automatically).

---

### Step 1: Install Dependencies

From the repository root directory, run:

```bash
npm run install:all
```

*(This installs root, backend, and frontend packages automatically).*

---

### Step 2: Start Backend & Frontend

You can run both concurrently from the root directory:

```bash
npm run dev
```

Or run them in separate terminals:

**Terminal 1 (Backend API & Tracker):**
```bash
cd backend
npm run dev
```
Backend will be live at: **http://localhost:5000**  
Tracking script hosted at: **http://localhost:5000/tracker.js**

**Terminal 2 (Frontend Dashboard):**
```bash
cd frontend
npm run dev
```
Dashboard will be live at: **http://localhost:3000**

---

### Step 3: Run Tests

Execute the automated backend test suite (testing health, ingestion, sessions, heatmap queries, and script serving):

```bash
cd backend
npm test
```

---

## 🧪 Testing the Tracking Script

### Method 1: Built-in Interactive Demo Store (Recommended)
1. Open the Dashboard at **http://localhost:3000**.
2. Click the **"Live Demo Store"** tab at the top.
3. Browse products, click **"Add to Cart"**, **"Buy Now"**, search items, or click categories.
4. Click **"Simulate New Visitor"** to generate new distinct session IDs.
5. Switch over to **"Sessions & Journeys"** or **"Heatmap Visualizer"** to immediately see your live clicks and journeys mapped!

### Method 2: Standalone HTML Page
Open `demo/index.html` in your web browser:
- It includes `<script src="http://localhost:5000/tracker.js"></script>`.
- Displays real-time on-screen click logs and session identifiers.

### Method 3: Embed on Any External Webpage
Add this script tag inside the `<head>` or `<body>` of any HTML page:

```html
<!-- CausalFunnel Tracking Script -->
<script 
  src="http://localhost:5000/tracker.js"
  data-endpoint="http://localhost:5000/api/events"
></script>
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/events` | Ingest single event or array of events. |
| `GET` | `/api/sessions` | Fetch aggregated sessions with event counts, breakdown, duration, and search filters. |
| `GET` | `/api/sessions/:sessionId/events` | Fetch chronological event timeline (User Journey) for a specific session. |
| `GET` | `/api/heatmap?url=<PAGE_URL>` | Fetch click positions (`x`, `y`, `viewportWidth`, `viewportHeight`, target elements) for a page. |
| `GET` | `/api/heatmap/pages` | Fetch list of distinct tracked pages with click and view totals. |
| `GET` | `/api/stats` | Macro metrics (total events, sessions, page views, clicks, top pages). |
| `GET` | `/tracker.js` | Serves the client tracking JavaScript library. |
| `GET` | `/api/health` | Service health status. |

---

## 💡 Assumptions and Trade-Offs

1. **Session Management & Inactivity**:
   - *Assumption*: A session is identified by `session_id` stored in `localStorage` with a fallback cookie.
   - *Trade-off*: An inactivity window of 30 minutes resets the session. In high-traffic production environments, this can also be backed by server-side session cookies with `HttpOnly` and `SameSite` flags.

2. **Heatmap Coordinate Normalization**:
   - *Assumption*: Clicks occur across devices with varying viewport resolutions (e.g., mobile 390x844 vs desktop 1440x900).
   - *Design Choice*: The tracker captures `click_x`, `click_y` along with `viewport_width` and `viewport_height`. The backend and heatmap visualizer compute normalized percentages (`normalizedX = (clickX / viewportW) * 100%`), allowing clicks to scale smoothly across different screen dimensions.

3. **Transport Mechanism**:
   - *Choice*: Used `navigator.sendBeacon` with fallback to `fetch({ keepalive: true })`.
   - *Advantage*: `sendBeacon` transmits data asynchronously over HTTP POST without blocking page navigation or cancellation when users quickly close or navigate away from the page.

4. **Zero-Config Database Fallback**:
   - *Design Choice*: Configured Mongoose to connect to standard `MONGODB_URI` / local MongoDB (`mongodb://127.0.0.1:27017`), while automatically provisioning an in-memory `MongoMemoryServer` fallback if external MongoDB is not detected.
   - *Benefit*: Any evaluator can clone and run the repo immediately without needing to configure or start a local MongoDB daemon.

---

## 📂 Project Structure

```
causalfunnel-analytics/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection & in-memory fallback
│   │   ├── models/
│   │   │   └── Event.js           # Structured Mongoose event schema
│   │   ├── routes/
│   │   │   ├── events.js          # POST /api/events ingestion
│   │   │   ├── sessions.js        # GET /api/sessions & session user journey
│   │   │   ├── heatmap.js         # GET /api/heatmap coordinates & page list
│   │   │   └── stats.js           # GET /api/stats overview metrics
│   │   ├── public/
│   │   │   └── tracker.js         # Standalone client tracking library
│   │   ├── utils/
│   │   │   └── seed.js            # Sample demo sessions generator
│   │   └── server.js              # Express server setup & API routing
│   ├── test/
│   │   └── api.test.js            # Automated integration test suite
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # App navigation & live connection indicator
│   │   │   ├── SessionsView.jsx   # Sessions table & filters
│   │   │   ├── SessionJourneyModal.jsx # Visual chronological user journey
│   │   │   ├── HeatmapView.jsx    # Visual click heatmap & density overlay
│   │   │   ├── DemoStoreView.jsx  # Interactive live tracking sandbox
│   │   │   └── OverviewStats.jsx  # Macro metrics & distribution
│   │   ├── api.js                 # API client
│   │   ├── App.jsx                # Main layout
│   │   ├── main.jsx
│   │   └── index.css              # Tailwind styling
│   ├── vite.config.js
│   └── package.json
├── demo/
│   └── index.html                 # Standalone webpage with tracker integration
├── package.json                   # Root package script runner
└── README.md
```

---

## 📄 License
MIT
