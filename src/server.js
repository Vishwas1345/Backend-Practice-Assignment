const express = require('express');
const morgan = require('morgan');
const routes = require('./routes');

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

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Test Analytics Ingestion Service                           ║
╚══════════════════════════════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ Database initialized
✓ Ready to accept requests

Endpoints:
  POST   /orgs           - Create organization
  POST   /projects       - Create project
  POST   /tokens         - Create API token
  POST   /ingest         - Ingest test results (requires auth)
  GET    /health         - Health check
  GET    /metrics        - Service metrics

  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

