const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

/**
 * GET /api/funnel
 * Calculates an e-commerce conversion funnel across all tracked sessions:
 * Stage 1: Store Visit (Session Start / Page View)
 * Stage 2: Product Engagement (View Product Page or Product Link Click)
 * Stage 3: Cart Action (Add to Cart Click)
 * Stage 4: Checkout Intent (Buy Now or Checkout Click)
 */
router.get('/', async (req, res) => {
  try {
    const allSessions = await Event.distinct('sessionId');
    const totalSessionsCount = allSessions.length;

    if (totalSessionsCount === 0) {
      return res.json({
        success: true,
        totalSessions: 0,
        stages: [
          { id: 'visit', name: '1. Store Visit', count: 0, percentage: 0, dropoff: 0 },
          { id: 'view_product', name: '2. Product Viewed', count: 0, percentage: 0, dropoff: 0 },
          { id: 'add_to_cart', name: '3. Added to Cart', count: 0, percentage: 0, dropoff: 0 },
          { id: 'checkout', name: '4. Checkout / Buy Now', count: 0, percentage: 0, dropoff: 0 }
        ],
        conversionRate: 0
      });
    }

    // Stage 1: All sessions that had a page_view
    const visitSessions = await Event.distinct('sessionId', {
      eventType: 'page_view'
    });

    // Stage 2: Sessions that viewed a product page or clicked a product detail
    const productSessions = await Event.distinct('sessionId', {
      $or: [
        { pageUrl: { $regex: /(product|headphones|watch|stand|keyboard)/i } },
        { targetText: { $regex: /(detail|explore|product|view)/i } }
      ]
    });

    // Stage 3: Sessions with "Add to Cart" click
    const cartSessions = await Event.distinct('sessionId', {
      eventType: 'click',
      $or: [
        { targetText: { $regex: /add to cart/i } },
        { targetId: { $regex: /add-cart/i } }
      ]
    });

    // Stage 4: Sessions with "Buy Now" or "Checkout"
    const checkoutSessions = await Event.distinct('sessionId', {
      eventType: 'click',
      $or: [
        { targetText: { $regex: /(buy now|checkout|purchase)/i } },
        { targetId: { $regex: /(buy-now|checkout)/i } },
        { pageUrl: { $regex: /checkout/i } }
      ]
    });

    const s1 = visitSessions.length || totalSessionsCount;
    const s2 = productSessions.length;
    const s3 = cartSessions.length;
    const s4 = checkoutSessions.length;

    const calcPct = (count) => (s1 > 0 ? +((count / s1) * 100).toFixed(1) : 0);
    const calcDropoff = (prev, curr) => (prev > 0 ? +(((prev - curr) / prev) * 100).toFixed(1) : 0);

    const stages = [
      {
        id: 'visit',
        name: '1. Store Landing',
        description: 'Visitors arrived and viewed landing page',
        count: s1,
        percentage: 100,
        dropoff: 0
      },
      {
        id: 'view_product',
        name: '2. Product Engagement',
        description: 'Explored specific product pages or items',
        count: s2,
        percentage: calcPct(s2),
        dropoff: calcDropoff(s1, s2)
      },
      {
        id: 'add_to_cart',
        name: '3. Cart Intent',
        description: 'Clicked "Add to Cart"',
        count: s3,
        percentage: calcPct(s3),
        dropoff: calcDropoff(s2, s3)
      },
      {
        id: 'checkout',
        name: '4. Conversion / Checkout',
        description: 'Initiated checkout or clicked "Buy Now"',
        count: s4,
        percentage: calcPct(s4),
        dropoff: calcDropoff(s3, s4)
      }
    ];

    res.json({
      success: true,
      totalSessions: totalSessionsCount,
      overallConversionRate: calcPct(s4),
      stages
    });
  } catch (err) {
    console.error('[API /funnel] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
