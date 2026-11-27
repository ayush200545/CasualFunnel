const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

/**
 * GET /api/stats
 * Overview dashboard metrics
 */
router.get('/', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const pageViews = await Event.countDocuments({ eventType: 'page_view' });
    const clicks = await Event.countDocuments({ eventType: 'click' });
    
    const distinctSessions = await Event.distinct('sessionId');
    const distinctPages = await Event.distinct('pageUrl');

    const topPages = await Event.aggregate([
      {
        $group: {
          _id: '$pageUrl',
          clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
          pageViews: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          url: '$_id',
          clicks: 1,
          pageViews: 1,
          total: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        totalSessions: distinctSessions.length,
        pageViews,
        clicks,
        totalPages: distinctPages.length,
        avgEventsPerSession: distinctSessions.length > 0 ? +(totalEvents / distinctSessions.length).toFixed(1) : 0,
        topPages,
      }
    });
  } catch (err) {
    console.error('[API /stats] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
