process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { app } = require('../src/server');
const { connectDB, closeDB } = require('../src/config/db');
const Event = require('../src/models/Event');

let server;
let baseUrl;

test.before(async () => {
  await connectDB();
  await Event.deleteMany({}); // Start clean

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDB();
});

test('GET /api/health should return ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
});

test('POST /api/events should reject invalid payloads', async () => {
  const res = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'test-sess',
      // missing eventType and pageUrl
    }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('POST /api/events should accept page_view and click events', async () => {
  const testSession = 'test-session-101';
  const testUrl = 'https://example.com/products';

  // 1. Send page_view
  const pvRes = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: testSession,
      event_type: 'page_view',
      page_url: testUrl,
      timestamp: new Date().toISOString(),
      viewport_width: 1440,
      viewport_height: 900
    }),
  });
  assert.strictEqual(pvRes.status, 201);
  const pvData = await pvRes.json();
  assert.strictEqual(pvData.success, true);
  assert.strictEqual(pvData.count, 1);

  // 2. Send click
  const clickRes = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: testSession,
      event_type: 'click',
      page_url: testUrl,
      timestamp: new Date().toISOString(),
      click_x: 250,
      click_y: 400,
      viewport_width: 1440,
      viewport_height: 900,
      target_tag: 'button',
      target_text: 'Add to Cart'
    }),
  });
  assert.strictEqual(clickRes.status, 201);
  const clickData = await clickRes.json();
  assert.strictEqual(clickData.success, true);
});

test('GET /api/sessions should list sessions with aggregated counts', async () => {
  const res = await fetch(`${baseUrl}/api/sessions`);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.ok(json.data.length >= 1);

  const session = json.data.find(s => s.sessionId === 'test-session-101');
  assert.ok(session, 'Should find test-session-101 in sessions list');
  assert.strictEqual(session.totalEvents, 2);
  assert.strictEqual(session.pageViews, 1);
  assert.strictEqual(session.clicks, 1);
  assert.strictEqual(session.pageCount, 1);
});

test('GET /api/sessions/:sessionId/events should return chronological events for session', async () => {
  const res = await fetch(`${baseUrl}/api/sessions/test-session-101/events`);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.events.length, 2);
  assert.strictEqual(json.events[0].eventType, 'page_view');
  assert.strictEqual(json.events[1].eventType, 'click');
  assert.strictEqual(json.events[1].targetText, 'Add to Cart');
  assert.strictEqual(json.summary.totalEvents, 2);
});

test('GET /api/heatmap should return click coordinates for specified page URL', async () => {
  const encodedUrl = encodeURIComponent('https://example.com/products');
  const res = await fetch(`${baseUrl}/api/heatmap?url=${encodedUrl}`);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.totalClicks, 1);
  assert.strictEqual(json.clicks[0].x, 250);
  assert.strictEqual(json.clicks[0].y, 400);
  assert.strictEqual(json.clicks[0].targetText, 'Add to Cart');
});

test('GET /tracker.js should serve tracking script file', async () => {
  const res = await fetch(`${baseUrl}/tracker.js`);
  assert.strictEqual(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes('CausalFunnel'));
  assert.ok(text.includes('CausalTracker'));
});

test('GET /api/funnel should calculate conversion funnel stages', async () => {
  const res = await fetch(`${baseUrl}/api/funnel`);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.stages));
  assert.strictEqual(json.stages.length, 4);
});

test('GET /api/sessions/:sessionId/export should export session as CSV and JSON', async () => {
  // Test CSV export
  const csvRes = await fetch(`${baseUrl}/api/sessions/test-session-101/export?format=csv`);
  assert.strictEqual(csvRes.status, 200);
  assert.ok(csvRes.headers.get('content-type').includes('text/csv'));
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Step,Timestamp,EventType,PageURL'));
  assert.ok(csvText.includes('page_view'));
  assert.ok(csvText.includes('click'));

  // Test JSON export
  const jsonRes = await fetch(`${baseUrl}/api/sessions/test-session-101/export?format=json`);
  assert.strictEqual(jsonRes.status, 200);
  const jsonData = await jsonRes.json();
  assert.strictEqual(jsonData.sessionId, 'test-session-101');
  assert.strictEqual(jsonData.eventCount, 2);
});
