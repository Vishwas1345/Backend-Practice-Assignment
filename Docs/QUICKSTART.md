# Quick Start Guide

## Installation & Running

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB connection
# PORT=3002
# MONGODB_URI=mongodb://localhost:27017
# DB_NAME=test_analytics

# Start the server
npm run dev

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

### 3. Create an API Token

```bash
curl -X POST http://localhost:3002/tokens \
  -H "Content-Type: application/json" \
  -d '{"project_id": "project-uuid"}'
```

⚠️ **Important:** Save the token! It's only shown once.

### 4. Ingest Test Results (New Format)

```bash
curl -X POST http://localhost:3002/ingest \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "tr_ci_build_123",
    "environment": "staging",
    "timestamp": "2026-01-12T10:00:00Z",
    "summary": {
      "total_test_cases": 8,
      "passed": 5,
      "failed": 2,
      "flaky": 1,
      "skipped": 0,
      "duration_ms": 15420
    },
    "test_suites": [
      {
        "suite_name": "Authentication Tests",
        "total_cases": 3,
        "passed": 2,
        "failed": 1,
        "duration_ms": 5200,
        "test_cases": [
          {
            "name": "should login with valid credentials",
            "status": "passed",
            "duration_ms": 1800,
            "steps": 3,
            "error_message": null
          },
          {
            "name": "should reject invalid password",
            "status": "failed",
            "duration_ms": 2200,
            "steps": 2,
            "error_message": "Expected 401 but got 500"
          }
        ]
      }
    ]
  }'
```

**Response (first time):**
```json
{
  "message": "Test run ingested successfully",
  "run_id": "tr_ci_build_123",
  "environment": "staging",
  "summary": {
    "total_test_cases": 8,
    "passed": 5,
    "failed": 2,
    "flaky": 1,
    "skipped": 0,
    "duration_ms": 15420
  },
  "test_suites": [ ... ]
}
```

**Response (retry with same run_id):**
```json
{
  "message": "Test run already exists (idempotent)",
  "run_id": "tr_ci_build_123",
  "duplicate": true
}
```

### 5. Check Metrics (Auto-updating)

```bash
curl http://localhost:3002/metrics
```

**Response:**
```json
{
  "uptime_seconds": 1234,
  "counters": {
    "requests_total": 0,
    "orgs_created": 5,
    "projects_created": 12,
    "tokens_created": 8,
    "test_runs_ingested": 150,
    "duplicate_runs_rejected": 12,
    "errors": 0
  },
  "timestamp": "2026-01-12T11:53:53.000Z"
}
```

**Note:** Metrics automatically update when operations occur!

### 6. Health Check

```bash
curl http://localhost:3002/health
```

---

## Test Run Format

### Required Fields
- `run_id` - Must start with `tr_` prefix (e.g., `tr_test_123`)
- `environment` - Environment name (e.g., `staging`, `production`)
- `timestamp` - ISO 8601 timestamp
- `summary` - Test execution summary object
- `test_suites` - Array of test suites (can be empty)

### Summary Object
All fields required (non-negative numbers):
- `total_test_cases`
- `passed`
- `failed`
- `flaky`
- `skipped`
- `duration_ms`

### Test Suite (Optional)
- `suite_name` - Suite name
- `total_cases`, `passed`, `failed`, `duration_ms` - Statistics
- `test_cases` - Array of test case objects

### Test Case
- `name` - Test case name
- `status` - `passed`, `failed`, `flaky`, or `skipped`
- `duration_ms` - Execution time
- `steps` - Number of steps (optional)
- `error_message` - Error details (null if passed)

---

## What Makes This Production-Ready?

✅ **Security**
- Tokens are bcrypt-hashed
- Multi-tenancy with project-scoped tokens
- Comprehensive input validation

✅ **Reliability**
- Database-level idempotency
- Safe retries (duplicates return 200 OK)
- MVC architecture for maintainability

✅ **Observability**
- Structured logging
- Auto-updating metrics endpoint
- Request timing

✅ **Comprehensive Data**
- Environment tracking
- Test suite organization
- Individual test case details
- Flaky test detection
- Error message capture

---

## Troubleshooting

### Server won't start

Check if port 3002 is already in use:

```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <pid> /F
```

### Tests fail with ECONNREFUSED

Make sure the server is running:
```bash
npm run dev
```

Then run tests in a separate terminal:
```bash
npm test
```

### Authentication fails

- Use Bearer token format: `Authorization: Bearer <token>`
- Token must be the exact 64-character hex string
- Tokens are only shown once during creation

---

## What's Next?

See full documentation:
- [README.md](../README.md) - Complete documentation
- [CURL_COMMANDS.md](CURL_COMMANDS.md) - All API endpoints
- [WORKFLOW.md](WORKFLOW.md) - Development workflow
