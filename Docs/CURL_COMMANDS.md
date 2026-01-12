# API Endpoints - cURL Commands

Complete collection of cURL commands to test all API endpoints.

---

## 1. Health Check

**Check API health status**
```bash
curl -X GET http://localhost:3002/health
```

**Expected Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T10:00:00.000Z"
}
```

---

## 2. Metrics

**Get API usage metrics**
```bash
curl -X GET http://localhost:3002/metrics
```

**PowerShell:**
```powershell
curl http://localhost:3002/metrics
```

**Expected Response (200):**
```json
{
  "uptime_seconds": 1234,
  "counters": {
    "requests_total": 0,
    "orgs_created": 0,
    "projects_created": 0,
    "tokens_created": 0,
    "test_runs_ingested": 0,
    "duplicate_runs_rejected": 0,
    "errors": 0
  },
  "timestamp": "2026-01-12T11:46:49.000Z"
}
```

---

## 3. Create Organization

**Create a new organization**
```bash
curl -X POST http://localhost:3002/orgs \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corporation"}'
```

**PowerShell:**
```powershell
curl -X POST http://localhost:3002/orgs -H "Content-Type: application/json" -d '{\"name\": \"Acme Corporation\"}'
```

**Expected Response (201):**
```json
{
  "id": "uuid-here",
  "name": "Acme Corporation",
  "message": "Organization created successfully"
}
```

**Save the organization ID for next steps!**

---

## 3. Create Project

**Create a new project (replace ORG_ID with actual ID)**
```bash
curl -X POST http://localhost:3002/projects \
  -H "Content-Type: application/json" \
  -d '{"org_id": "YOUR_ORG_ID_HERE", "name": "Web App Tests"}'
```

**PowerShell:**
```powershell
curl -X POST http://localhost:3002/projects -H "Content-Type: application/json" -d '{\"org_id\": \"YOUR_ORG_ID_HERE\", \"name\": \"Web App Tests\"}'
```

**Expected Response (201):**
```json
{
  "id": "project-uuid",
  "org_id": "org-uuid",
  "name": "Web App Tests",
  "message": "Project created successfully"
}
```

**Save the project ID for next steps!**

---

## 4. Create API Token

**Generate API token (replace PROJECT_ID with actual ID)**
```bash
curl -X POST http://localhost:3002/tokens \
  -H "Content-Type: application/json" \
  -d '{"project_id": "YOUR_PROJECT_ID_HERE"}'
```

**PowerShell:**
```powershell
curl -X POST http://localhost:3002/tokens -H "Content-Type: application/json" -d '{\"project_id\": \"YOUR_PROJECT_ID_HERE\"}'
```

**Expected Response (201):**
```json
{
  "id": "token-uuid",
  "project_id": "project-uuid",
  "token": "long-token-string-here",
  "message": "API token created successfully. Save this token - it will not be shown again!"
}
```

**Save the token for authentication!**

---

## 5. Ingest Test Run

**Ingest comprehensive test run data (replace YOUR_TOKEN with actual token)**

### Simple Example
```bash
curl -X POST http://localhost:3002/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "run_id": "tr_test_001",
    "environment": "staging",
    "timestamp": "2026-01-12T10:00:00.000Z",
    "summary": {
      "total_test_cases": 3,
      "passed": 2,
      "failed": 1,
      "flaky": 0,
      "skipped": 0,
      "duration_ms": 5000
    },
    "test_suites": [
      {
        "suite_name": "API Tests",
        "total_cases": 3,
        "passed": 2,
        "failed": 1,
        "duration_ms": 5000,
        "test_cases": [
          {
            "name": "GET /users should return users",
            "status": "passed",
            "duration_ms": 1500,
            "steps": 2,
            "error_message": null
          },
          {
            "name": "POST /users should create user",
            "status": "passed",
            "duration_ms": 2000,
            "steps": 3,
            "error_message": null
          },
          {
            "name": "DELETE /users should fail",
            "status": "failed",
            "duration_ms": 1500,
            "steps": 2,
            "error_message": "Expected 404 but got 500"
          }
        ]
      }
    ]
  }'
```

### PowerShell (Compact)
```powershell
$body = @{
  run_id = "tr_test_001"
  environment = "staging"
  timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  summary = @{
    total_test_cases = 3
    passed = 2
    failed = 1
    flaky = 0
    skipped = 0
    duration_ms = 5000
  }
  test_suites = @(
    @{
      suite_name = "API Tests"
      total_cases = 3
      passed = 2
      failed = 1
      duration_ms = 5000
      test_cases = @(
        @{
          name = "GET /users"
          status = "passed"
          duration_ms = 1500
          steps = 2
          error_message = $null
        },
        @{
          name = "POST /users"
          status = "passed"
          duration_ms = 2000
          steps = 3
          error_message = $null
        },
        @{
          name = "DELETE /users"
          status = "failed"
          duration_ms = 1500
          steps = 2
          error_message = "Expected 404 but got 500"
        }
      )
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri http://localhost:3002/ingest -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer YOUR_TOKEN_HERE"} -Body $body
```

**Expected Response (201):**
```json
{
  "message": "Test run ingested successfully",
  "run_id": "tr_test_001",
  "environment": "staging",
  "summary": {
    "total_test_cases": 3,
    "passed": 2,
    "failed": 1,
    "flaky": 0,
    "skipped": 0,
    "duration_ms": 5000
  }
}
```

---

## 6. Test Idempotency

**Send the same run_id again (should return 200, not 409)**
```bash
curl -X POST http://localhost:3002/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "run_id": "tr_test_001",
    "environment": "staging",
    "timestamp": "2026-01-12T10:00:00.000Z",
    "summary": {
      "total_test_cases": 3,
      "passed": 2,
      "failed": 1,
      "flaky": 0,
      "skipped": 0,
      "duration_ms": 5000
    },
    "test_suites": []
  }'
```

**Expected Response (200):**
```json
{
  "message": "Test run already exists (idempotent)",
  "run_id": "tr_test_001",
  "duplicate": true
}
```

---

## Error Testing

### Invalid Token (401)
```bash
curl -X POST http://localhost:3002/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-123" \
  -d '{"run_id": "tr_test_002", "environment": "test", "timestamp": "2026-01-12T10:00:00.000Z", "summary": {"total_test_cases": 0, "passed": 0, "failed": 0, "flaky": 0, "skipped": 0, "duration_ms": 0}, "test_suites": []}'
```

### Missing tr_ Prefix (400)
```bash
curl -X POST http://localhost:3002/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"run_id": "invalid_id", "environment": "test", "timestamp": "2026-01-12T10:00:00.000Z", "summary": {"total_test_cases": 0, "passed": 0, "failed": 0, "flaky": 0, "skipped": 0, "duration_ms": 0}, "test_suites": []}'
```

### Missing Required Fields (400)
```bash
curl -X POST http://localhost:3002/orgs \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Complete Workflow Example

**Run these commands in sequence:**

```bash
# 1. Create Organization
ORG_RESPONSE=$(curl -s -X POST http://localhost:3002/orgs -H "Content-Type: application/json" -d '{"name": "Test Corp"}')
ORG_ID=$(echo $ORG_RESPONSE | jq -r '.id')
echo "Organization ID: $ORG_ID"

# 2. Create Project
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3002/projects -H "Content-Type: application/json" -d "{\"org_id\": \"$ORG_ID\", \"name\": \"Test Project\"}")
PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.id')
echo "Project ID: $PROJECT_ID"

# 3. Create Token
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3002/tokens -H "Content-Type: application/json" -d "{\"project_id\": \"$PROJECT_ID\"}")
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 4. Ingest Test Run
curl -X POST http://localhost:3002/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "run_id": "tr_automated_test",
    "environment": "production",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "summary": {
      "total_test_cases": 5,
      "passed": 4,
      "failed": 1,
      "flaky": 0,
      "skipped": 0,
      "duration_ms": 10000
    },
    "test_suites": []
  }'
```

---

## Tips

1. **Pretty Print Responses**: Add `| jq` to the end of curl commands (requires jq installed)
2. **Save to File**: Add `> response.json` to save response
3. **Verbose Output**: Add `-v` flag to see request/response headers
4. **Silent Mode**: Add `-s` flag to hide progress bar

**Example with pretty print:**
```bash
curl -s -X GET http://localhost:3002/health | jq
```
