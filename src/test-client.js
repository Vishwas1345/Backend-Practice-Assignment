/**
 * Test client to demonstrate API usage and verify functionality
 * Run with: node src/test-client.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('Test Analytics Ingestion Service - Integration Test');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. Create Organization
    console.log('1️⃣  Creating organization...');
    const timestamp = Date.now();
    const orgRes = await makeRequest('POST', '/orgs', { name: `Test Corp ${timestamp}` });
    console.log(`   Status: ${orgRes.status}`);
    console.log(`   Response:`, orgRes.data);
    console.log('');

    if (orgRes.status !== 201) {
      throw new Error('Failed to create organization');
    }
    const orgId = orgRes.data.id;

    // 2. Create Project
    console.log('2️⃣  Creating project...');
    const projectRes = await makeRequest('POST', '/projects', {
      org_id: orgId,
      name: 'Web App Tests'
    });
    console.log(`   Status: ${projectRes.status}`);
    console.log(`   Response:`, projectRes.data);
    console.log('');

    if (projectRes.status !== 201) {
      throw new Error('Failed to create project');
    }
    const projectId = projectRes.data.id;

    // 3. Create API Token
    console.log('3️⃣  Creating API token...');
    const tokenRes = await makeRequest('POST', '/tokens', { project_id: projectId });
    console.log(`   Status: ${tokenRes.status}`);
    console.log(`   Token ID: ${tokenRes.data.id}`);
    console.log(`   Token: ${tokenRes.data.token.substring(0, 20)}...`);
    console.log('');

    if (tokenRes.status !== 201) {
      throw new Error('Failed to create token');
    }
    const apiToken = tokenRes.data.token;

    // 4. Ingest Test Run (First time) - With comprehensive data
    console.log('4️⃣  Ingesting test run with comprehensive data (first attempt)...');
    const runId = `tr_test_${Date.now()}`;
    const mockTestData = {
      run_id: runId,
      environment: 'staging',
      timestamp: new Date().toISOString(),
      summary: {
        total_test_cases: 8,
        passed: 5,
        failed: 2,
        flaky: 1,
        skipped: 0,
        duration_ms: 15420
      },
      test_suites: [
        {
          suite_name: 'Authentication Tests',
          total_cases: 3,
          passed: 2,
          failed: 1,
          duration_ms: 5200,
          test_cases: [
            {
              name: 'should login with valid credentials',
              status: 'passed',
              duration_ms: 1800,
              steps: 3,
              error_message: null
            },
            {
              name: 'should logout successfully',
              status: 'passed',
              duration_ms: 1200,
              steps: 2,
              error_message: null
            },
            {
              name: 'should reject invalid password',
              status: 'failed',
              duration_ms: 2200,
              steps: 2,
              error_message: 'Expected status 401 but got 500'
            }
          ]
        },
        {
          suite_name: 'User Profile Tests',
          total_cases: 3,
          passed: 2,
          failed: 0,
          duration_ms: 4800,
          test_cases: [
            {
              name: 'should update user profile',
              status: 'passed',
              duration_ms: 2100,
              steps: 4,
              error_message: null
            },
            {
              name: 'should upload profile picture',
              status: 'flaky',
              duration_ms: 1500,
              steps: 3,
              error_message: 'Intermittent timeout on upload'
            }
          ]
        }
      ]
    };

    const ingestRes1 = await makeRequest('POST', '/ingest', mockTestData, apiToken);
    console.log(`   Status: ${ingestRes1.status}`);
    console.log(`   Response:`, ingestRes1.data);
    console.log('');

    if (ingestRes1.status !== 201) {
      throw new Error('Failed to ingest test run');
    }

    // 5. Ingest Test Run (Duplicate - Testing Idempotency)
    console.log('5️⃣  Ingesting same test run (testing idempotency)...');
    const ingestRes2 = await makeRequest('POST', '/ingest', mockTestData, apiToken);
    console.log(`   Status: ${ingestRes2.status}`);
    console.log(`   Response:`, ingestRes2.data);
    console.log('');

    // 6. Test Authorization Failure
    console.log('6️⃣  Testing invalid token (should fail)...');
    const authFailRes = await makeRequest('POST', '/ingest', mockTestData, 'invalid-token-12345');
    console.log(`   Status: ${authFailRes.status}`);
    console.log(`   Response:`, authFailRes.data);
    console.log('');

    // 7. Test Validation Error
    console.log('7️⃣  Testing invalid payload (should fail)...');
    const validationFailRes = await makeRequest('POST', '/ingest', {
      run_id: 'test-run-invalid',  // Missing tr_ prefix
      environment: 'test',
      timestamp: 'not-a-date',  // Invalid timestamp
      summary: {
        total_test_cases: -1,  // Negative number
        passed: 'invalid',  // Wrong type
        failed: 0,
        flaky: 0,
        skipped: 0,
        duration_ms: 0
      }
    }, apiToken);
    console.log(`   Status: ${validationFailRes.status}`);
    console.log(`   Response:`, validationFailRes.data);
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
