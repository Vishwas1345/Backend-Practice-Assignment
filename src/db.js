const { MongoClient } = require('mongodb');

// MongoDB connection URL - defaults to local MongoDB instance
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vishwas_db_user:Vishwas12qw%21%40QW@vishwas1.vutark0.mongodb.net/testdino?appName=Vishwas1";
const DB_NAME = 'test_analytics';

let db = null;
let client = null;

// Connect to MongoDB
async function connectDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log('✓ MongoDB connected successfully');
    
    // Create indexes for better query performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Create indexes on collections
async function createIndexes() {
  try {
    // Organizations: unique name
    await db.collection('organizations').createIndex({ name: 1 }, { unique: true });
    
    // Projects: unique (org_id, name) combination
    await db.collection('projects').createIndex({ org_id: 1, name: 1 }, { unique: true });
    
    // API tokens: unique token_hash, index on project_id
    await db.collection('api_tokens').createIndex({ token_hash: 1 }, { unique: true });
    await db.collection('api_tokens').createIndex({ project_id: 1 });
    
    // Test runs: unique (project_id, run_id) for idempotency, index on timestamp
    await db.collection('test_runs').createIndex({ project_id: 1, run_id: 1 }, { unique: true });
    await db.collection('test_runs').createIndex({ timestamp: 1 });
    await db.collection('test_runs').createIndex({ project_id: 1 });
    
  } catch (error) {
    // Indexes may already exist, ignore duplicate key errors
    if (error.code !== 11000) {
      console.error('Error creating indexes:', error);
    }
  }
}

// Get database instance
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return db;
}

// Graceful shutdown
async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('✓ MongoDB connection closed');
  }
}

module.exports = {
  connectDatabase,
  getDb,
  closeDatabase
};
