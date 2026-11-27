const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

/**
 * GET /api/sessions
 * Fetch aggregated list of sessions with total events, breakdown, duration, and page list
 */
router.get('/', async (req, res) => {
  try {
    const { search, sortBy = 'lastSeen', sortOrder = 'desc', limit = 100 } = req.query;

    const pipeline = [
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          pageViews: {
            $sum: {
              $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0]
            }
          },
          clicks: {
            $sum: {
              $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0]
            }
          },
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
          pages: { $addToSet: '$pageUrl' },
          eventsList: {
            $push: {
              eventType: '$eventType',
              pageUrl: '$pageUrl',
              timestamp: '$timestamp'
            }
          }
        }
      },
      {
        $addFields: {
          sessionId: '$_id',
          durationMs: { $subtract: ['$lastSeen', '$firstSeen'] },
          durationSeconds: {
            $round: [{ $divide: [{ $subtract: ['$lastSeen', '$firstSeen'] }, 1000] }, 1]
          },
          pageCount: { $size: '$pages' }
        }
      },
      {
        $project: {
          _id: 0,
          sessionId: 1,
          totalEvents: 1,
          pageViews: 1,
          clicks: 1,
          firstSeen: 1,
          lastSeen: 1,
          durationMs: 1,
          durationSeconds: 1,
          pageCount: 1,
          pages: 1
        }
      }
    ];

    // Optional search filter by sessionId
    if (search && search.trim()) {
      pipeline.unshift({
        $match: {
          sessionId: { $regex: search.trim(), $options: 'i' }
        }
      });
    }

    // Sort order
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = ['totalEvents', 'firstSeen', 'lastSeen', 'durationSeconds'].includes(sortBy)
      ? sortBy
      : 'lastSeen';

    pipeline.push({ $sort: { [sortField]: sortDirection } });
    pipeline.push({ $limit: Math.min(parseInt(limit, 10) || 100, 500) });

    const sessions = await Event.aggregate(pipeline);

    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    console.error('[API /sessions] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/sessions/:sessionId/events
 * Fetch all events for a specific session ordered chronologically (User Journey)
 */
router.get('/:sessionId/events', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID parameter is required' });
    }

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No events found for session: ${sessionId}`,
        data: []
      });
    }

    // Augment with relative time offset (seconds elapsed since session start)
    const startTime = new Date(events[0].timestamp).getTime();
    const augmentedEvents = events.map((ev, index) => {
      const currentEvTime = new Date(ev.timestamp).getTime();
      const elapsedSeconds = Math.round((currentEvTime - startTime) / 100) / 10;
      const prevEvTime = index > 0 ? new Date(events[index - 1].timestamp).getTime() : currentEvTime;
      const deltaSeconds = Math.round((currentEvTime - prevEvTime) / 100) / 10;

      return {
        ...ev,
        stepNumber: index + 1,
        elapsedSeconds,
        deltaSeconds,
      };
    });

    const summary = {
      sessionId,
      totalEvents: events.length,
      pageViews: events.filter(e => e.eventType === 'page_view').length,
      clicks: events.filter(e => e.eventType === 'click').length,
      startTime: events[0].timestamp,
      endTime: events[events.length - 1].timestamp,
      totalDurationSeconds: Math.round((new Date(events[events.length - 1].timestamp).getTime() - startTime) / 1000),
      pagesVisited: Array.from(new Set(events.map(e => e.pageUrl))),
    };

    res.json({
      success: true,
      summary,
      events: augmentedEvents,
    });
  } catch (err) {
    console.error(`[API /sessions/:sessionId/events] Error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/sessions/:sessionId/export
 * Exports session events as CSV or JSON
 * Query: ?format=csv|json
 */
router.get('/:sessionId/export', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;

    const events = await Event.find({ sessionId }).sort({ timestamp: 1 }).lean();

    if (!events || events.length === 0) {
      return res.status(404).json({ error: `No events found for session: ${sessionId}` });
    }

    if (format.toLowerCase() === 'csv') {
      const headers = ['Step', 'Timestamp', 'EventType', 'PageURL', 'ClickX', 'ClickY', 'TargetTag', 'TargetText', 'Selector'];
      const rows = events.map((e, idx) => {
        const escape = (val) => (val == null ? '' : `"${String(val).replace(/"/g, '""')}"`);
        return [
          idx + 1,
          e.timestamp ? new Date(e.timestamp).toISOString() : '',
          escape(e.eventType),
          escape(e.pageUrl),
          e.clickX ?? '',
          e.clickY ?? '',
          escape(e.targetTag),
          escape(e.targetText),
          escape(e.metadata?.selector || '')
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.csv"`);
      return res.send(csvContent);
    }

    // Default JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.json"`);
    return res.json({
      sessionId,
      exportedAt: new Date().toISOString(),
      eventCount: events.length,
      events,
    });
  } catch (err) {
    console.error('[API /sessions/:sessionId/export] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
