const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

/**
 * GET /api/heatmap
 * Fetch click data for a specific page URL.
 * Query: ?url=...
 */
router.get('/', async (req, res) => {
  try {
    const { url, limit = 2000 } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter "url". E.g. /api/heatmap?url=https://example.com/shop'
      });
    }

    // Support exact match or matching pathname
    const cleanUrl = url.trim();

    const query = {
      eventType: 'click',
      pageUrl: cleanUrl,
      clickX: { $ne: null },
      clickY: { $ne: null }
    };

    const clicks = await Event.find(query)
      .select('sessionId timestamp clickX clickY viewportWidth viewportHeight targetTag targetId targetClass targetText pageUrl')
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit, 10) || 2000, 5000))
      .lean();

    // Summary statistics for this page
    const totalPageViews = await Event.countDocuments({
      eventType: 'page_view',
      pageUrl: cleanUrl
    });

    const uniqueSessions = new Set(clicks.map(c => c.sessionId)).size;

    res.json({
      success: true,
      pageUrl: cleanUrl,
      totalClicks: clicks.length,
      totalPageViews,
      uniqueSessions,
      clicks: clicks.map(c => ({
        id: c._id,
        sessionId: c.sessionId,
        x: c.clickX,
        y: c.clickY,
        viewportWidth: c.viewportWidth || 1440,
        viewportHeight: c.viewportHeight || 900,
        // Normalized percentage coordinates (0 - 100%) for responsive overlays
        normalizedX: c.viewportWidth ? Math.min(100, Math.max(0, (c.clickX / c.viewportWidth) * 100)) : null,
        normalizedY: c.viewportHeight ? Math.min(100, Math.max(0, (c.clickY / c.viewportHeight) * 100)) : null,
        targetTag: c.targetTag,
        targetId: c.targetId,
        targetClass: c.targetClass,
        targetText: c.targetText,
        timestamp: c.timestamp,
      }))
    });
  } catch (err) {
    console.error('[API /heatmap] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/heatmap/pages
 * List all tracked pages with click counts and page views (for dropdown selector)
 */
router.get('/pages', async (req, res) => {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: '$pageUrl',
          totalEvents: { $sum: 1 },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          lastActivity: { $max: '$timestamp' },
          uniqueSessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          _id: 0,
          url: '$_id',
          totalEvents: 1,
          clicks: 1,
          pageViews: 1,
          lastActivity: 1,
          uniqueSessionCount: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { clicks: -1, pageViews: -1 } }
    ]);

    res.json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (err) {
    console.error('[API /heatmap/pages] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
