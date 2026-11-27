const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/db');
const Event = require('../models/Event');

const PAGES = [
  'http://localhost:3000/demo',
  'http://localhost:3000/demo/product/headphones',
  'http://localhost:3000/demo/cart',
  'http://localhost:3000/demo/checkout',
];

const BUTTONS = [
  { tag: 'button', text: 'Add to Cart', class: 'btn-primary', id: 'add-cart-btn', xRange: [450, 650], yRange: [380, 440] },
  { tag: 'button', text: 'Buy Now', class: 'btn-accent', id: 'buy-now-btn', xRange: [450, 650], yRange: [460, 520] },
  { tag: 'a', text: 'View Product Details', class: 'link-detail', id: 'prod-link', xRange: [150, 350], yRange: [320, 360] },
  { tag: 'button', text: 'Proceed to Checkout', class: 'btn-checkout', id: 'checkout-btn', xRange: [600, 800], yRange: [500, 550] },
  { tag: 'input', text: 'Search products...', class: 'search-box', id: 'search-input', xRange: [300, 600], yRange: [70, 110] },
  { tag: 'button', text: 'Apply Coupon', class: 'btn-coupon', id: 'coupon-btn', xRange: [700, 850], yRange: [340, 380] },
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSessionEvents(sessionId, startTime) {
  const events = [];
  let currentTime = new Date(startTime).getTime();

  // 1. Initial Page View
  events.push({
    sessionId,
    eventType: 'page_view',
    pageUrl: PAGES[0],
    timestamp: new Date(currentTime),
    viewportWidth: 1440,
    viewportHeight: 900,
    metadata: { title: 'Demo Store - Home', referrer: 'https://google.com' }
  });

  // 2. User searches or clicks on product
  currentTime += randomBetween(3000, 8000);
  const searchBtn = BUTTONS[4];
  events.push({
    sessionId,
    eventType: 'click',
    pageUrl: PAGES[0],
    timestamp: new Date(currentTime),
    clickX: randomBetween(searchBtn.xRange[0], searchBtn.xRange[1]),
    clickY: randomBetween(searchBtn.yRange[0], searchBtn.yRange[1]),
    viewportWidth: 1440,
    viewportHeight: 900,
    targetTag: searchBtn.tag,
    targetId: searchBtn.id,
    targetClass: searchBtn.class,
    targetText: searchBtn.text
  });

  // 3. User navigates to product details
  currentTime += randomBetween(2000, 6000);
  const prodLink = BUTTONS[2];
  events.push({
    sessionId,
    eventType: 'click',
    pageUrl: PAGES[0],
    timestamp: new Date(currentTime),
    clickX: randomBetween(prodLink.xRange[0], prodLink.xRange[1]),
    clickY: randomBetween(prodLink.yRange[0], prodLink.yRange[1]),
    viewportWidth: 1440,
    viewportHeight: 900,
    targetTag: prodLink.tag,
    targetId: prodLink.id,
    targetClass: prodLink.class,
    targetText: prodLink.text
  });

  currentTime += 1000;
  events.push({
    sessionId,
    eventType: 'page_view',
    pageUrl: PAGES[1],
    timestamp: new Date(currentTime),
    viewportWidth: 1440,
    viewportHeight: 900,
    metadata: { title: 'Demo Store - Wireless Headphones' }
  });

  // 4. Click Add to Cart multiple times or Buy Now
  const clicksOnProduct = randomBetween(2, 5);
  for (let i = 0; i < clicksOnProduct; i++) {
    currentTime += randomBetween(1500, 7000);
    const btn = Math.random() > 0.4 ? BUTTONS[0] : BUTTONS[1];
    events.push({
      sessionId,
      eventType: 'click',
      pageUrl: PAGES[1],
      timestamp: new Date(currentTime),
      clickX: randomBetween(btn.xRange[0], btn.xRange[1]),
      clickY: randomBetween(btn.yRange[0], btn.yRange[1]),
      viewportWidth: 1440,
      viewportHeight: 900,
      targetTag: btn.tag,
      targetId: btn.id,
      targetClass: btn.class,
      targetText: btn.text
    });
  }

  // 5. Some sessions proceed to cart
  if (Math.random() > 0.3) {
    currentTime += randomBetween(3000, 8000);
    events.push({
      sessionId,
      eventType: 'page_view',
      pageUrl: PAGES[2],
      timestamp: new Date(currentTime),
      viewportWidth: 1440,
      viewportHeight: 900,
      metadata: { title: 'Demo Store - Shopping Cart' }
    });

    currentTime += randomBetween(2000, 5000);
    const chk = BUTTONS[3];
    events.push({
      sessionId,
      eventType: 'click',
      pageUrl: PAGES[2],
      timestamp: new Date(currentTime),
      clickX: randomBetween(chk.xRange[0], chk.xRange[1]),
      clickY: randomBetween(chk.yRange[0], chk.yRange[1]),
      viewportWidth: 1440,
      viewportHeight: 900,
      targetTag: chk.tag,
      targetId: chk.id,
      targetClass: chk.class,
      targetText: chk.text
    });
  }

  return events;
}

async function seedData() {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  console.log('[Seed] Clearing existing events...');
  await Event.deleteMany({});

  const sampleSessions = [
    'sess_cf9a128e-4a81-42cb-b1b7-90c742398a01',
    'sess_df8b239f-5b92-43dc-c2c8-01d853409b02',
    'sess_ea7c340a-6ca3-44ed-d3d9-12e964510c03',
    'sess_fb6d451b-7db4-45fe-e4ea-23fa75621d04',
    'sess_0c5e562c-8ec5-460f-f5fb-340b86732e05',
    'sess_1d4f673d-9fd6-4710-060c-451c97843f06',
    'sess_2e3a784e-00e7-4821-171d-562da8954007',
  ];

  let totalEvents = [];
  const baseTime = Date.now() - (3 * 3600 * 1000); // 3 hours ago

  sampleSessions.forEach((sessId, idx) => {
    const sessionStartTime = baseTime + (idx * 25 * 60 * 1000);
    const sessionEvents = generateSessionEvents(sessId, sessionStartTime);
    totalEvents = totalEvents.concat(sessionEvents);
  });

  const inserted = await Event.insertMany(totalEvents);
  console.log(`[Seed] Successfully seeded ${inserted.length} events across ${sampleSessions.length} sessions.`);

  await closeDB();
  console.log('[Seed] Finished successfully.');
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

module.exports = { seedData };
