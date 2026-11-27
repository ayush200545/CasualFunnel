const mongoose = require('mongoose');

let mongodInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/causalfunnel_analytics';
  
  try {
    // Set a short connection timeout to quickly fall back to in-memory if local MongoDB isn't running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected to database at: ${uri}`);
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to external/local MongoDB (${err.message}).`);
    console.log('[MongoDB] Starting zero-config in-memory MongoDB fallback (MongoMemoryServer)...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Connected to in-memory MongoDB at: ${memoryUri}`);
      console.log('[MongoDB] NOTE: Events will be kept in memory for this session.');
    } catch (memoryErr) {
      console.error('[MongoDB] Fatal error initializing in-memory database:', memoryErr);
      throw memoryErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database.');
  });
}

async function closeDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}

module.exports = { connectDB, closeDB };
