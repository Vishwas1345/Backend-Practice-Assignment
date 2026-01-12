# Test Analytics Ingestion Backend

A minimal, production-ready backend service for ingesting automated test results from CI systems.

## Features

- ✅ Multi-tenant support (Organizations → Projects → Test Runs)
- ✅ Secure API token authentication with bcrypt hashing
- ✅ Idempotent test result ingestion
- ✅ Request validation and comprehensive error handling
- ✅ Structured logging with request timing
- ✅ Simple metrics endpoint
- ✅ SQLite database with WAL mode for better concurrency

---

## Setup Instructions

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or use nodemon for development
npm run dev
```

The server will start on port 3002 (configurable via `PORT` environment variable).

### Testing

Run the integration test client:

```bash
npm test
```

This will:
1. Create an organization
2. Create a project
3. Generate an API token
4. Ingest test results
5. Test idempotency by re-ingesting the same run
6. Test authentication failures
7. Test validation errors
8. Display metrics

---

## API Endpoints

### 1. Create Organization

```http
POST /orgs
Content-Type: application/json

{
  "name": "Acme Corp"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "message": "Organization created successfully"
}
```

---

### 2. Create Project

```http
POST /projects
Content-Type: application/json

{
  "org_id": "uuid",
  "name": "Web App Tests"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "org_id": "uuid",
  "name": "Web App Tests",
  "message": "Project created successfully"
}
```

---

### 3. Create API Token

```http
POST /tokens
Content-Type: application/json

{
  "project_id": "uuid"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "token": "64-character-hex-string",
  "message": "API token created successfully. Save this token - it will not be shown again!"
}
```

⚠️ **Important:** The raw token is only returned once. Store it securely.

---

### 4. Ingest Test Results

```http
POST /ingest
Authorization: Bearer <api_token>
Content-Type: application/json

{
  "run_id": "unique-run-identifier",
  "status": "passed",
  "duration_ms": 1234,
  "timestamp": "2026-01-12T10:00:00Z"
}
```

**Response (201) - First ingestion:**
```json
{
  "message": "Test run ingested successfully",
  "run_id": "unique-run-identifier",
  "status": "passed"
}
```

**Response (200) - Duplicate (idempotent):**
```json
{
  "message": "Test run already exists (idempotent)",
  "run_id": "unique-run-identifier",
  "duplicate": true
}
```

---

### 5. Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T10:00:00Z"
}
```

---

### 6. Metrics

```http
GET /metrics
```

**Response (200):**
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

---

## Design Decisions

### 1. Database Choice: SQLite

**Why SQLite?**
- Zero configuration
- Excellent for embedded/single-server deployments
- ACID compliant with WAL mode
- Sufficient for moderate traffic
- Easy to backup (single file)

**Trade-offs:**
- Not ideal for multi-server deployments (would need PostgreSQL/MySQL)
- Write throughput limited compared to client-server databases

### 2. Storage Schema

```sql
organizations (id, name, created_at)
  ↓
projects (id, org_id, name, created_at)
  ↓
api_tokens (id, project_id, token_hash, created_at)
  ↓
test_runs (id, project_id, run_id, status, duration_ms, timestamp, created_at)
```

**Key constraints:**
- `UNIQUE(project_id, run_id)` on test_runs → enforces idempotency at DB level
- Foreign keys with `ON DELETE CASCADE` → maintains referential integrity
- Indexes on frequently queried columns

### 3. Synchronous vs Async Database Operations

I chose `better-sqlite3` (synchronous) over `sqlite3` (async) because:
- Simpler error handling
- Lower latency per request (no async overhead)
- SQLite operations are fast enough that async isn't needed
- Better for read-heavy workloads

---

## Idempotency Implementation

### The Problem

In distributed systems, network failures, timeouts, and retries are common. A CI system might:
1. Send a test result to the API
2. Experience a timeout before receiving the response
3. Retry the same request
4. Create duplicate data ❌

### The Solution

**Database-level idempotency using unique constraints:**

```sql
UNIQUE(project_id, run_id)
```

This ensures:
- ✅ No duplicate test runs for the same `run_id` within a project
- ✅ Safe retries at the database level (even if app crashes mid-request)
- ✅ Atomic operation (no race conditions)

### Implementation

```javascript
try {
  stmt.run(projectId, run_id, status, duration_ms, timestamp);
  return res.status(201).json({ message: 'Created' });
} catch (dbError) {
  if (dbError.message.includes('UNIQUE constraint failed')) {
    // Duplicate detected - return success for safe retry
    return res.status(200).json({ message: 'Already exists', duplicate: true });
  }
  throw dbError;
}
```

**Why return 200 instead of 409 Conflict?**

Returning `409 Conflict` would force clients to handle it as an error, complicating retry logic. By returning `200 OK` with a `duplicate: true` flag, we signal:
- ✅ Your request was understood
- ✅ The data you wanted is already there
- ✅ No action needed

This makes retry logic trivial:

```javascript
// Client code - no special handling needed!
const response = await fetch('/ingest', { ... });
if (response.ok) {
  console.log('Success!');
}
```

---

## Token Security

### Storage

- ❌ **Never** store tokens in plain text
- ✅ Hash tokens using bcrypt with salt rounds = 10
- ✅ Store only the hash in the database

### Generation

```javascript
const rawToken = crypto.randomBytes(32).toString('hex');  // 64 hex chars
const tokenHash = await bcrypt.hash(rawToken, 10);
```

- Uses cryptographically secure random bytes
- 256 bits of entropy (2^256 possible tokens)
- Impossible to reverse the hash

### Verification

```javascript
const isValid = await bcrypt.compare(providedToken, storedHash);
```

- Constant-time comparison (prevents timing attacks)
- Salt is stored in the hash (bcrypt handles this automatically)

### Authentication Flow

1. Client sends: `Authorization: Bearer <token>`
2. Server extracts token
3. Server queries all token hashes
4. Server compares provided token against each hash using bcrypt
5. If match found → attach `projectId` to request
6. If no match → return 401 Unauthorized

### Multi-Tenancy Security

- Tokens are scoped to **one project only**
- After authentication, `req.auth.projectId` is set
- All ingestion requests automatically write to the correct project
- Cross-project access is impossible

---

## Bugs Discovered & Fixed

### 🐛 Bug #1: Headers Sent After Response (Critical)

**What happened:**

During initial testing, the server crashed with this error:

```
Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
    at ServerResponse.setHeader (node:_http_outgoing:642:11)
```

**The problematic code:**

```javascript
// Response time tracking middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', duration.toString());  // ❌ Too late!
  });
  next();
});
```

**Why this was a bug:**

The `finish` event fires **after** the response has been sent to the client. At that point:
- ❌ Headers are already sent (can't modify them)
- ❌ Trying to set headers causes a crash
- ❌ Server becomes unavailable after first request

**How I discovered it:**

When running the first integration test, the server successfully handled the first request (creating an organization) but then crashed immediately. The test client received `ECONNRESET` on the second request.

**The fix:**

Removed the custom response-time middleware entirely and relied on Morgan's built-in timing:

```javascript
// Morgan already tracks response time
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
```

**Lesson learned:**

Don't reinvent the wheel when battle-tested solutions exist. Morgan's `:response-time` token calculates timing correctly by measuring before the response is sent. Trying to set headers in the `finish` event is always wrong because headers must be set before `res.send()` or `res.json()` is called.

---

### 🐛 Bug #2: Idempotency Breaking Client Retry Logic (Design Bug)

**What happened:**

In the initial design, when a duplicate test run was detected, I planned to return:

```javascript
return res.status(409).json({ 
  error: 'Conflict', 
  message: 'Test run already exists' 
});
```

**Why this was a bug:**

HTTP 409 Conflict is treated as an **error** by most HTTP clients. This meant:
- ❌ Retry logic would fail
- ❌ Clients had to write special error handling for duplicates
- ❌ Monitoring systems would alert on "errors" that weren't actually problems

**The scenario:**

```
CI System                          API Server
    |                                  |
    |-- POST /ingest (run_id=123) --->|
    |                                  |-- 201 Created
    |<---------- timeout -------------|
    |                                  |
    |-- POST /ingest (run_id=123) --->|
    |                                  |-- 409 Conflict ❌
    |                                  |
    |  (Retry fails, CI marks test    |
    |   ingestion as failed)           |
```

**How I discovered it:**

While designing the API, I realized that returning an error code for a successful idempotent operation was semantically wrong. If a client retries with the same `run_id`, it means they want to ensure the data exists—and it does! That's a success, not a conflict.

**The fix:**

Return 200 OK for duplicates:

```javascript
return res.status(200).json({ 
  message: 'Test run already exists (idempotent)',
  run_id,
  duplicate: true
});
```

Now the flow is:

```
CI System                          API Server
    |                                  |
    |-- POST /ingest (run_id=123) --->|
    |                                  |-- 201 Created
    |<---------- timeout -------------|
    |                                  |
    |-- POST /ingest (run_id=123) --->|
    |                                  |-- 200 OK ✅
    |                                  |   { duplicate: true }
    |  (Success! Retry is safe)        |
```

**Lesson learned:**

Idempotent endpoints should return success codes (2xx) even when the operation was already performed. The `duplicate: true` flag allows clients to distinguish between new creation (201) and idempotent retry (200), but both are treated as success. This makes retry logic trivial and aligns with REST best practices.

---

## Observability Strategy

### 1. Structured Logging

Every significant event is logged with context:

```javascript
console.log(`[TEST_RUN_INGESTED] project_id=${projectId} run_id=${run_id} status=${status} duration=${duration}ms`);
```

**Why structured logs?**
- Easy to parse with log aggregators (Splunk, ELK, CloudWatch)
- Searchable by `project_id`, `run_id`, etc.
- Includes timing information for performance analysis

### 2. Request Timing

Morgan middleware logs every HTTP request with response time:

```
POST /ingest 201 84 - 23.456 ms
```

This helps identify slow endpoints immediately.

### 3. Metrics Endpoint

Simple in-memory counters:

```json
{
  "test_runs_ingested": 1523,
  "duplicate_runs_rejected": 47,
  "requests_total": 1598
}
```

**Why in-memory metrics?**
- Zero overhead
- Perfect for basic monitoring
- Can be scraped by Prometheus or similar tools

**Production upgrade path:**
- Replace with StatsD/Prometheus client
- Add histograms for latency percentiles
- Track error rates by endpoint

### Why I chose this approach:

1. **Simplicity**: No external dependencies
2. **Low overhead**: Logging is async, metrics are in-memory
3. **Actionable**: Logs include everything needed to debug issues
4. **Scalable**: Easy to upgrade to proper observability stack later

---

## Performance & Scaling Analysis

### What breaks first at 10× traffic?

**Current bottleneck: Token verification**

```javascript
// O(n) iteration through all tokens
for (const storedToken of tokens) {
  const isValid = await bcrypt.compare(token, storedToken.token_hash);
  if (isValid) {
    return next();
  }
}
```

**Why this breaks:**
- If you have 1,000 tokens and the matching token is the last one checked, you do 1,000 bcrypt comparisons
- bcrypt is intentionally slow (~100ms per comparison)
- 1,000 comparisons = ~100 seconds per request! 🐌

**At 10× traffic:**
- Current: 100 requests/sec with 10 tokens = manageable
- 10×: 1,000 requests/sec with 100 tokens = **requests queue up faster than they complete**

**Solution:**
Add a lookup cache:

```javascript
// In-memory cache: token → projectId
const tokenCache = new Map();

// On token creation:
tokenCache.set(rawToken, projectId);

// On authentication:
if (tokenCache.has(token)) {
  req.auth = { projectId: tokenCache.get(token) };
  return next();
}
```

**Caveat:** Cache invalidation on token deletion becomes necessary.

---

### One optimization I would **NOT** do early

**Database connection pooling / switching to PostgreSQL**

**Why not?**

1. **SQLite is fast enough for moderate traffic**
   - Can handle 1,000+ writes/sec with WAL mode
   - No network latency (local file)
   - Simple backups

2. **Premature optimization**
   - Adds operational complexity (database server, connection pooling, migrations)
   - Only needed when horizontal scaling is required
   - Current bottleneck is token verification, not database

3. **When to switch:**
   - When you need multi-server deployments
   - When write throughput exceeds 5,000/sec
   - When you need complex queries with JOINs across large datasets

**Better early optimizations:**
1. Add token caching (solves the #1 bottleneck)
2. Add response caching for read-heavy endpoints
3. Optimize indexes based on actual query patterns

---

## Project Structure

```
test-result-ingestion-backend/
├── src/
│   ├── server.js       # Express server & startup
│   ├── routes.js       # API endpoint handlers
│   ├── db.js           # Database initialization & schema
│   ├── auth.js         # Token hashing & authentication middleware
│   ├── validation.js   # Request payload validation
│   └── test-client.js  # Integration test client
├── data/
│   └── test_analytics.db  # SQLite database (auto-created)
├── package.json
└── README.md
```

---

## Assumptions & Limitations

### Assumptions
- Single server deployment
- Moderate traffic (< 1,000 req/sec)
- Tokens are long-lived (no expiration implemented)
- Test runs are immutable once created

### Known Limitations
1. **No token expiration** - tokens are valid forever
2. **No token revocation API** - can only delete from DB manually
3. **No pagination** - metrics and data retrieval is unbounded
4. **No rate limiting** - vulnerable to DoS attacks
5. **In-memory metrics** - reset on server restart

### Production Considerations
- Add token expiration & refresh mechanism
- Implement rate limiting (e.g., express-rate-limit)
- Add API versioning (e.g., /v1/ingest)
- Use proper secret management (not hardcoded salt rounds)
- Add database backups & replication
- Implement audit logging for security events

---

## Testing

Run the integration test:

```bash
# Start the server in one terminal
npm start

# Run tests in another terminal
npm test
```

Expected output:

```
======================================================================
Test Analytics Ingestion Service - Integration Test
======================================================================

1️⃣  Creating organization...
   Status: 201
   Response: { id: '...', name: 'Test Corp', message: '...' }

2️⃣  Creating project...
   Status: 201
   Response: { id: '...', org_id: '...', name: 'Web App Tests', ... }

3️⃣  Creating API token...
   Status: 201
   Token ID: ...
   Token: 64-char-hex-string...

4️⃣  Ingesting test run (first attempt)...
   Status: 201
   Response: { message: 'Test run ingested successfully', ... }

5️⃣  Ingesting same test run (testing idempotency)...
   Status: 200
   Response: { message: '...idempotent...', duplicate: true }

6️⃣  Testing invalid token (should fail)...
   Status: 401
   Response: { error: 'Unauthorized', ... }

7️⃣  Testing invalid payload (should fail)...
   Status: 400
   Response: { error: 'Validation Error', details: [...] }

8️⃣  Checking service metrics...
   Status: 200
   Metrics: { orgs_created: 1, projects_created: 1, ... }

======================================================================
✅ All tests completed successfully!
======================================================================
```

---

## License

MIT

