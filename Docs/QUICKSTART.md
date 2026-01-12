# Quick Start Guide

## Installation & Running

```bash
# Install dependencies
npm install

# The app uses MongoDB Atlas by default (configured in src/db.js)
# No additional setup needed!

# Start the server
npm start

# Run integration tests (in another terminal)
npm test
```

## Quick API Example

### 1. Create an Organization

```bash
curl -X POST http://localhost:3002/orgs \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company"}'
```

**Response:**
```json
{
  "id": "uuid-here",
  "name": "My Company",
  "message": "Organization created successfully"
}
```

### 2. Create a Project

```bash
curl -X POST http://localhost:3002/projects \
  -H "Content-Type: application/json" \
  -d '{"org_id": "uuid-from-step-1", "name": "My Project"}'
```

**Response:**
```json
{
  "id": "project-uuid",
  "org_id": "uuid-from-step-1",
  "name": "My Project",
  "message": "Project created successfully"
}
```

### 3. Create an API Token

```bash
curl -X POST http://localhost:3002/tokens \
  -H "Content-Type: application/json" \
  -d '{"project_id": "project-uuid"}'
```

**Response:**
```json
{
  "id": "token-uuid",
  "project_id": "project-uuid",
  "token": "64-character-token-save-this",
  "message": "API token created successfully. Save this token - it will not be shown again!"
}
```

⚠️ **Important:** Save the token! It's only shown once and is stored as a hash.

### 4. Ingest Test Results

```bash
curl -X POST http://localhost:3002/ingest \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "ci-build-123",
    "status": "passed",
    "duration_ms": 45000,
    "timestamp": "2026-01-12T10:00:00Z"
  }'
```

**Response (first time):**
```json
{
  "message": "Test run ingested successfully",
  "run_id": "ci-build-123",
  "status": "passed"
}
```

**Response (retry with same run_id):**
```json
{
  "message": "Test run already exists (idempotent)",
  "run_id": "ci-build-123",
  "duplicate": true
}
```

### 5. Check Metrics

```bash
curl http://localhost:3002/metrics
```

**Response:**
```json
{
  "orgs_created": 5,
  "projects_created": 12,
  "tokens_created": 8,
  "test_runs_ingested": 1523,
  "duplicate_runs_rejected": 47,
  "requests_total": 1598
}
```

### 6. Health Check

```bash
curl http://localhost:3002/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T10:00:00Z"
}
```

---

## CI Integration Example

Here's how you might integrate this into your CI pipeline:

```bash
#!/bin/bash
# ci-ingest-results.sh

API_TOKEN="your-token-here"
RUN_ID="${CI_COMMIT_SHA}-${CI_PIPELINE_ID}"
STATUS="passed"  # or "failed"
DURATION_MS=45000
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://your-server:3002/ingest \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"run_id\": \"${RUN_ID}\",
    \"status\": \"${STATUS}\",
    \"duration_ms\": ${DURATION_MS},
    \"timestamp\": \"${TIMESTAMP}\"
  }"
```

---

## What Makes This Production-Ready?

✅ **Security**
- Tokens are bcrypt-hashed (never stored in plain text)
- Multi-tenancy: tokens are scoped to one project
- Validation on all inputs
- Proper error messages without leaking internals

✅ **Reliability**
- Database-level idempotency (UNIQUE constraints)
- Safe retries (duplicates return 200 OK)
- Foreign keys with CASCADE for data integrity
- WAL mode for better concurrency

✅ **Observability**
- Structured logging with context
- Request timing via Morgan
- Metrics endpoint for monitoring
- Error tracking with stack traces

✅ **Error Handling**
- 400 for validation errors
- 401 for authentication failures
- 404 for missing resources
- 409 for conflicts
- 500 for server errors (with logging)

---

## Database Location

MongoDB Atlas cloud database: `test_analytics`

To inspect the database:

**Option 1: MongoDB Compass (GUI)**
- Download from: https://www.mongodb.com/products/compass
- Connect using your MongoDB Atlas connection string
- Browse collections: organizations, projects, api_tokens, test_runs

**Option 2: MongoDB Shell (mongosh)**
```bash
# Connect to your Atlas cluster
mongosh "your-connection-string"

# Use the database
use test_analytics

# View collections
show collections

# Query data
db.organizations.find().pretty()
db.projects.find().pretty()
db.test_runs.find().limit(5).pretty()
```

---

## Troubleshooting

### Server won't start

Check if port 3000 is already in use:

```bash
# Windows
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <pid> /F
```

### Tests fail with ECONNREFUSED

Make sure the server is running in another terminal:

```bash
npm start
```

Then run tests in a separate terminal:

```bash
npm test
```

### Authentication fails

- Make sure you're using the Bearer token format: `Authorization: Bearer <token>`
- The token must be the exact 64-character hex string returned from POST /tokens
- Tokens are never stored in plain text, so you can't retrieve them later

---

## What's Next?

To make this production-ready at scale:

1. **Add token expiration & refresh**
2. **Implement rate limiting**
3. **Add pagination for data retrieval**
4. **Switch to PostgreSQL for multi-server deployments**
5. **Add proper secret management**
6. **Implement audit logging**
7. **Add API versioning**

See README.md for detailed design decisions and scaling analysis.

