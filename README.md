# Test Result Ingestion Backend

A Node.js/Express backend service for ingesting and storing comprehensive test execution results with detailed test case analytics.

## 🚀 Features

- **Comprehensive Test Data** - Ingest and store test suites
- **MVC Architecture** - Clean separation of concerns with routes, controllers, services, and models
- **API Token Authentication** - Secure Bearer token authentication
- **Idempotent Ingestion** - Safe retries with duplicate detection
- **Real-time Metrics** - Track API usage with auto-updating counters
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **MongoDB Storage** - Scalable document-based storage

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd test-result-ingetion-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB connection string
# PORT=3002
# MONGODB_URI=mongodb://localhost:27017
# DB_NAME=test_analytics
```

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Run Tests
```bash
npm test
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Metrics
```
GET /metrics
```
Returns real-time API usage statistics.

### Create Organization
```
POST /orgs
Content-Type: application/json

{
  "name": "My Organization"
}
```

### Create Project
```
POST /projects
Content-Type: application/json

{
  "org_id": "org_xyz",
  "name": "My Project"
}
```

### Create API Token
```
POST /tokens
Content-Type: application/json

{
  "project_id": "proj_xyz",
  "name": "CI-Token",
  "token" : "tap...".
  "message" : "API token created successfully. Save this token - it will not be shown again!"
}
```

### Ingest Test Run
```
POST /ingest
Authorization: Bearer <token>
Content-Type: application/json

{
  "run_id": "tr_test_001",
  "environment": "staging",
  "timestamp": "2026-01-12T10:00:00.000Z",
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
        }
      ]
    }
  ]
}
```

## 📊 Test Run Data Structure

### Required Fields
- `run_id` - Unique identifier with `tr_` prefix (e.g., `tr_test_123`)
- `environment` - Execution environment (e.g., `staging`, `production`)
- `timestamp` - ISO 8601 timestamp
- `summary` - Test execution summary object
- `test_suites` - Array of test suites (can be empty)

### Summary Object
- `total_test_cases` - Total number of test cases
- `passed` - Number of passed tests
- `failed` - Number of failed tests
- `flaky` - Number of flaky tests
- `skipped` - Number of skipped tests
- `duration_ms` - Total execution time in milliseconds

### Test Suite Object
- `suite_name` - Name of the test suite
- `total_cases` - Number of test cases in suite
- `passed` - Passed tests in suite
- `failed` - Failed tests in suite
- `duration_ms` - Suite execution time
- `test_cases` - Array of test case objects

### Test Case Object
- `name` - Test case name
- `status` - `passed`, `failed`, `flaky`, or `skipped`
- `duration_ms` - Execution time
- `steps` - Number of test steps (optional)
- `error_message` - Error details if failed (null if passed)

## 🏗️ Project Structure

```
src/
├── controllers/          # HTTP request/response handling
│   ├── organization.controller.js
│   ├── project.controller.js
│   ├── token.controller.js
│   ├── testRun.controller.js
│   └── metrics.controller.js
├── services/            # Business logic
│   ├── organization.service.js
│   ├── project.service.js
│   ├── token.service.js
│   └── testRun.service.js
├── middleware/          # Request processing
│   ├── auth.middleware.js
│   └── validation.middleware.js
├── models/              # Data models
│   ├── organization.model.js
│   ├── project.model.js
│   ├── apiToken.model.js
│   └── testRun.model.js
├── utils/               # Helpers
│   └── response.util.js
├── routes/              # Route definitions
│   └── routes.js
├── config/              # Configuration
│   └── db.config.js
├── test/                # Test scripts
│   ├── manual-test.js
│   ├── test-client.js
│   └── mockTestData.js
├── server.js            # Express app setup

Docs/                    # Documentation
├── CURL_COMMANDS.md     # API testing commands
└── IMPLEMENTATION_SUMMARY.md # Technical implementation details
```

## 🔐 Authentication

The API uses Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/ingest \
  -d '{ ... }'
```

Tokens are:
- Generated per project
- Permanent (no expiration)
- Hashed in database using bcrypt
- Shown only once upon creation

## 📈 Metrics Endpoint

Track API usage in real-time:

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
    "projects_created": 10,
    "tokens_created": 8,
    "test_runs_ingested": 150,
    "duplicate_runs_rejected": 12,
    "errors": 0
  },
  "timestamp": "2026-01-12T11:53:53.000Z"
}
```

Metrics automatically update when:
- Organizations are created
- Projects are created
- Tokens are generated
- Test runs are ingested
- Duplicate runs are detected

### Why In-Memory Metrics?
We chose simple in-memory counters for this project to provide **immediate, zero-configuration observability**. 
1. **Simplicity**: No need to set up external monitoring stacks (Prometheus, Grafana) for basic health checks.
2. **Real-time**: Instant feedback on ingestion rates and error counts.
3. **Lightweight**: Minimal performance overhead compared to complex instrumentation.
4. **Sufficiency**: For many deployments, knowing the current failure/success counts since the last restart is sufficient for operational awareness.

## 🧪 Testing

### Integration Tests
```bash
npm test
```

Runs comprehensive integration tests including:
- Organization creation
- Project creation
- Token generation
- Test run ingestion
- Idempotency verification
- Authentication validation
- Input validation

### Manual Testing
```bash
node src/manual-test.js
```

Interactive testing utility for individual endpoints.

## 🔄 Idempotency

Test run ingestion is idempotent using the `run_id`:
- First ingestion: Returns `201 Created`
- Duplicate ingestion: Returns `200 OK` with `duplicate: true`
- Safe for retries

## 📈 Scaling Thoughts

### What breaks first if traffic increases 10×?
**The CPU.**
The current authentication implementation uses `bcrypt` to verify tokens on **every request**. `bcrypt` is intentionally computationally expensive (CPU intensive) to resist brute-force attacks.
In a single-threaded Node.js environment, a 10x increase in authenticated traffic would likely cause the Event Loop to block while computing hashes, leading to high latency and eventual timeouts (`503 Service Unavailable`), even if the database is fine.

### One optimization I would NOT do early
**Database Sharding.**
MongoDB can handle millions of documents and high throughput on a single replica set. Sharding introduces significant operational complexity (balancing chunks, query routing).
It is better to scale vertically (larger instances) or optimize indexes first. Sharding should only be considered when the working set exceeds RAM or write throughput hits single-node limits.

## 🐛 Known Issues & Limitations

- **Metrics Reset**: Since metrics are in-memory, they reset to zero whenever the server restarts or re-deploys.
- **No Token Revocation**: Once issued, a token is valid forever until deleted from the database. There is no expiry mechanism.

## 📝 Environment Variables

Create a `.env` file with:

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017
DB_NAME=test_analytics
```

## 🚦 Quick Start

1. **Start MongoDB**
2. **Install dependencies**: `npm install`
3. **Create `.env` file** with your MongoDB URI
4. **Start server**: `npm run dev`
5. **Run tests**: `npm test`
6. **Check health**: `curl http://localhost:3002/health`

## 📚 Documentation

- [CURL Commands](Docs/CURL_COMMANDS.md) - Complete API testing guide
- [Implementation Summary](Docs/IMPLEMENTATION_SUMMARY.md) - Deep dive into architecture and features

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Validation**: Custom middleware
- **Architecture**: MVC pattern

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please follow the MVC architecture pattern.

---

**Built with ❤️ for better test analytics**
