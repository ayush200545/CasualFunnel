const mongoose = require('mongoose');

let mongodInstance = null;
let cachedConnection = null;

async function connectDB() {
  // If already connected, return existing connection (crucial for Vercel serverless caching)
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/causalfunnel_analytics';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: process.env.VERCEL ? 8000 : 3000,
      bufferCommands: false, // Recommended for serverless
    });
    cachedConnection = conn;
    console.log(`[MongoDB] Connected to database at: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
    return conn;
  } catch (err) {
    if (process.env.VERCEL) {
      console.error('[MongoDB Error] Vercel Serverless environment detected. Please configure MONGODB_URI in your Vercel Environment Variables:', err.message);
      throw err;
    }

    console.warn(`[MongoDB] Could not connect to external/local MongoDB (${err.message}).`);
    console.log('[MongoDB] Starting zero-config in-memory MongoDB fallback (MongoMemoryServer)...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(memoryUri);
      cachedConnection = conn;
      console.log(`[MongoDB] Connected to in-memory MongoDB at: ${memoryUri}`);
      console.log('[MongoDB] NOTE: Events will be kept in memory for this session.');
      return conn;
    } catch (memoryErr) {
      console.error('[MongoDB] Fatal error initializing in-memory database:', memoryErr);
      throw memoryErr;
    }
  }
}

async function closeDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  cachedConnection = null;
}

module.exports = { connectDB, closeDB };
