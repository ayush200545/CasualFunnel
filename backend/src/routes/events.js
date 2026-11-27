const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

/**
 * Normalizes raw payload into schema-compliant fields.
 * Handles both camelCase and snake_case inputs from client.
 */
function normalizeEventPayload(data) {
  const sessionId = data.sessionId || data.session_id;
  const eventType = data.eventType || data.event_type;
  const pageUrl = data.pageUrl || data.page_url;
  const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

  if (!sessionId || !eventType || !pageUrl) {
    throw new Error('Missing required fields: sessionId, eventType, and pageUrl are required.');
  }

  const validTypes = ['page_view', 'click', 'custom'];
  if (!validTypes.includes(eventType)) {
    throw new Error(`Invalid eventType: "${eventType}". Allowed: ${validTypes.join(', ')}`);
  }

  return {
    sessionId: String(sessionId).trim(),
    eventType,
    pageUrl: String(pageUrl).trim(),
    timestamp,
    clickX: data.clickX ?? data.click_x ?? null,
    clickY: data.clickY ?? data.click_y ?? null,
    viewportWidth: data.viewportWidth ?? data.viewport_width ?? null,
    viewportHeight: data.viewportHeight ?? data.viewport_height ?? null,
    targetTag: data.targetTag || data.target_tag || null,
    targetId: data.targetId || data.target_id || null,
    targetClass: data.targetClass || data.target_class || null,
    targetText: data.targetText || data.target_text || null,
    metadata: data.metadata || {},
  };
}

/**
 * POST /api/events
 * Ingest single or batched user interaction events
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    let eventsToInsert = [];

    if (Array.isArray(body)) {
      if (body.length === 0) {
        return res.status(400).json({ error: 'Event batch array is empty' });
      }
      eventsToInsert = body.map(normalizeEventPayload);
    } else if (body && typeof body === 'object') {
      eventsToInsert = [normalizeEventPayload(body)];
    } else {
      return res.status(400).json({ error: 'Request body must be an event object or array of events' });
    }

    const savedEvents = await Event.insertMany(eventsToInsert);
    return res.status(201).json({
      success: true,
      message: `Successfully stored ${savedEvents.length} event(s)`,
      count: savedEvents.length,
      insertedIds: savedEvents.map(e => e._id),
    });
  } catch (err) {
    console.error('[API /events] Ingestion error:', err.message);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/events
 * Optional debugging endpoint to fetch recent events with query filters
 */
router.get('/', async (req, res) => {
  try {
    const { sessionId, eventType, pageUrl, limit = 50 } = req.query;
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (eventType) filter.eventType = eventType;
    if (pageUrl) filter.pageUrl = pageUrl;

    const events = await Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 200))
      .lean();

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
