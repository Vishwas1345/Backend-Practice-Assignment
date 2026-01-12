require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const routes = require('./routes');
const { connectDatabase, closeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// HTTP request logging with timing
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Error handling for invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON payload'
    });
  }
  next(err);
});

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED_ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

// Start server after connecting to database
async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDatabase();

    // Then start the Express server
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Test Analytics Ingestion Service                           ║
╚══════════════════════════════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ MongoDB connected
✓ Ready to accept requests

Endpoints:
  POST   /orgs           - Create organization
  POST   /projects       - Create project
  POST   /tokens         - Create API token
  POST   /ingest         - Ingest test results (requires auth)
  GET    /health         - Health check

MongoDB URI: ${process.env.MONGODB_URI}
Database: test_analytics

      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

