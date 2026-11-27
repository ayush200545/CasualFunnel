const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { seedData } = require('./utils/seed');
const Event = require('./models/Event');
const eventsRouter = require('./routes/events');
const sessionsRouter = require('./routes/sessions');
const heatmapRouter = require('./routes/heatmap');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins so tracker can submit from demo pages / external origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers: express.json() and express.text() (for navigator.sendBeacon)
app.use(express.json({ limit: '2mb' }));
app.use(express.text({ type: ['text/plain', 'application/x-www-form-urlencoded'], limit: '2mb' }));

// Middleware to parse text/plain body into JSON if sendBeacon sends stringified JSON
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // ignore parse error and proceed
    }
  }
  next();
});

// Serve tracker.js publicly at /tracker.js as well as /public/tracker.js
app.use('/tracker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tracker.js'));
});
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/heatmap', heatmapRouter);
app.use('/api/stats', statsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CausalFunnel Analytics API',
    version: '1.0.0'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
async function startServer() {
  await connectDB();

  // If database is completely empty on startup, populate sample sessions so evaluators can inspect immediately
  try {
    const existingCount = await Event.countDocuments();
    if (existingCount === 0) {
      console.log('[Server] Database is empty. Seeding initial demo sessions & heatmap data...');
      // generate initial mock data without closing DB
      const sampleSessions = [
        'sess_cf9a128e-4a81-42cb-b1b7-90c742398a01',
        'sess_df8b239f-5b92-43dc-c2c8-01d853409b02',
        'sess_ea7c340a-6ca3-44ed-d3d9-12e964510c03',
        'sess_fb6d451b-7db4-45fe-e4ea-23fa75621d04',
        'sess_0c5e562c-8ec5-460f-f5fb-340b86732e05'
      ];
      const PAGES = [
        'http://localhost:3000/demo/store-home',
        'http://localhost:3000/demo/headphones',
        'http://localhost:3000/demo/cart'
      ];
      const initialEvents = [];
      const baseTime = Date.now() - 3600000;
      sampleSessions.forEach((sessId, sIdx) => {
        let t = baseTime + sIdx * 600000;
        PAGES.forEach((pg, pIdx) => {
          initialEvents.push({
            sessionId: sessId,
            eventType: 'page_view',
            pageUrl: pg,
            timestamp: new Date(t),
            viewportWidth: 1440,
            viewportHeight: 900
          });
          t += 4000;
          for (let c = 0; c < 3; c++) {
            initialEvents.push({
              sessionId: sessId,
              eventType: 'click',
              pageUrl: pg,
              timestamp: new Date(t),
              clickX: 450 + Math.floor(Math.random() * 200),
              clickY: 350 + Math.floor(Math.random() * 150),
              viewportWidth: 1440,
              viewportHeight: 900,
              targetTag: 'button',
              targetText: c % 2 === 0 ? 'Add to Cart' : 'Buy Now'
            });
            t += 3000;
          }
        });
      });
      await Event.insertMany(initialEvents);
      console.log(`[Server] Pre-seeded ${initialEvents.length} events across ${sampleSessions.length} demo sessions.`);
    }
  } catch (seedErr) {
    console.warn('[Server] Auto-seed check notice:', seedErr.message);
  }

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` CausalFunnel Analytics Backend Running`);
    console.log(` Port: http://localhost:${PORT}`);
    console.log(` Tracker Script: http://localhost:${PORT}/tracker.js`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
