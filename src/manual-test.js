/**
 * Manual Testing Utility
 * Use this file to manually test individual endpoints
 * 
 * Usage:
 * 1. Start the server: npm run dev
 * 2. Run this file: node manual-test.js
 * 3. Uncomment the test you want to run
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';

/**
 * Make an HTTP request to the API
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API path (e.g., '/orgs')
 * @param {object} data - Request body (optional)
 * @param {string} token - Bearer token (optional)
 * @returns {Promise<object>} Response with status and data
 */
async function makeRequest(method, path, data = null, token = null) {
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
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// =============================================================================
// MANUAL TEST FUNCTIONS
// =============================================================================

/**
 * Test: Health Check
 */
async function testHealthCheck() {
    console.log('\n🏥 Testing Health Check...');
    const response = await makeRequest('GET', '/health');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
}

/**
 * Test: Create Organization
 */
async function testCreateOrganization() {
    console.log('\n🏢 Testing Create Organization...');
    const response = await makeRequest('POST', '/orgs', {
        name: 'Sahil org'
    });
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 201) {
        console.log('\n✅ Organization created! Save this ID:', response.data.id);
    }
}

/**
 * Test: Create Project
 * @param {string} orgId - Organization ID from previous step
 */
async function testCreateProject(orgId) {
    console.log('\n📁 Testing Create Project...');
    const response = await makeRequest('POST', '/projects', {
        org_id: orgId,
        name: 'Sahil Project'
    });
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 201) {
        console.log('\n✅ Project created! Save this ID:', response.data.id);
    }
}

/**
 * Test: Create API Token
 * @param {string} projectId - Project ID from previous step
 */
async function testCreateToken(projectId) {
    console.log('\n🔑 Testing Create API Token...');
    const response = await makeRequest('POST', '/tokens', {
        project_id: projectId
    });
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 201) {
        console.log('\n✅ Token created! Save this token:', response.data.token);
    }
}

/**
 * Test: Ingest Test Run
 * @param {string} token - API token from previous step
 */
async function testIngestTestRun(token) {
    console.log('\n📊 Testing Ingest Test Run...');
    const response = await makeRequest('POST', '/ingest', {
        run_id: `tr_manual_test_123432`,
        environment: 'production',
        timestamp: new Date().toISOString(),
        summary: {
            total_test_cases: 4,
            passed: 1,
            failed: 1,
            flaky: 1,
            skipped: 0,
            duration_ms: 1200
        },
        test_suites: [
            {
                suite_name: 'Mock tests',
                total_cases: 2,
                passed: 1,
                failed: 1,
                duration_ms: 5000,
                test_cases: [
                    {
                        name: 'GET /users should return users',
                        status: 'passed',
                        duration_ms: 1500,
                        steps: 2,
                        error_message: null
                    },
                 
                    {
                        name: 'DELETE /users should fail on invalid ID',
                        status: 'failed',
                        duration_ms: 1500,
                        steps: 2,
                        error_message: 'Expected 404 but got 500'
                    }
                ]
            },
            {
                suite_name: 'UI Tests',
                total_cases: 2,
                passed: 1,
                failed: 0,
                duration_ms: 3500,
                test_cases: [
                    {
                        name: 'Login page should render',
                        status: 'passed',
                        duration_ms: 1200,
                        steps: 1,
                        error_message: null
                    },
                    {
                        name: 'Form submission should work',
                        status: 'flaky',
                        duration_ms: 2300,
                        steps: 4,
                        error_message: 'Intermittent timeout'
                    }
                ]
            }
        ]
    }, token);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
}

/**
 * Test: Ingest Test Run (Idempotency)
 * @param {string} token - API token
 * @param {string} runId - Same run_id to test idempotency
 */
async function testIngestDuplicate(token, runId) {
    console.log('\n🔄 Testing Idempotency (duplicate run_id)...');
    const response = await makeRequest('POST', '/ingest', {
        run_id: runId,
        environment: 'staging',
        timestamp: new Date().toISOString(),
        summary: {
            total_test_cases: 5,
            passed: 3,
            failed: 1,
            flaky: 1,
            skipped: 0,
            duration_ms: 8500
        },
        test_suites: []
    }, token);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
}

/**
 * Test: Invalid Token
 */
async function testInvalidToken() {
    console.log('\n❌ Testing Invalid Token...');
    const response = await makeRequest('POST', '/ingest', {
        run_id: 'test-unauthorized',
        status: 'failed',
        duration_ms: 2000,
        timestamp: new Date().toISOString()
    }, 'invalid-token-12345');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
}

/**
 * Test: Validation Error
 */
async function testValidationError() {
    console.log('\n⚠️ Testing Validation Error...');
    const response = await makeRequest('POST', '/orgs', {
        // Missing required 'name' field
    });
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
}

// =============================================================================
// COMPLETE WORKFLOW TEST
// =============================================================================

async function runCompleteWorkflow() {
    console.log('='.repeat(70));
    console.log('🚀 Running Complete Workflow Test');
    console.log('='.repeat(70));

    try {
        // 1. Health Check
        await testHealthCheck();

        // 2. Create Organization
        console.log('\n' + '='.repeat(70));
        const orgRes = await makeRequest('POST', '/orgs', {
            name: `Test Org ${Date.now()}`
        });
        console.log('✅ Organization Created:', orgRes.data.id);
        const orgId = orgRes.data.id;

        // 3. Create Project
        console.log('\n' + '='.repeat(70));
        const projectRes = await makeRequest('POST', '/projects', {
            org_id: orgId,
            name: 'Test Project'
        });
        console.log('✅ Project Created:', projectRes.data.id);
        const projectId = projectRes.data.id;

        // 4. Create Token
        console.log('\n' + '='.repeat(70));
        const tokenRes = await makeRequest('POST', '/tokens', {
            project_id: projectId
        });
        console.log('✅ Token Created:', tokenRes.data.token.substring(0, 20) + '...');
        const token = tokenRes.data.token;

        // 5. Ingest Test Run
        console.log('\n' + '='.repeat(70));
        const runId = `tr_workflow_${Date.now()}`;
        const ingestRes = await makeRequest('POST', '/ingest', {
            run_id: runId,
            environment: 'production',
            timestamp: new Date().toISOString(),
            summary: {
                total_test_cases: 3,
                passed: 2,
                failed: 1,
                flaky: 0,
                skipped: 0,
                duration_ms: 5000
            },
            test_suites: [
                {
                    suite_name: 'Smoke Tests',
                    total_cases: 3,
                    passed: 2,
                    failed: 1,
                    duration_ms: 5000,
                    test_cases: [
                        {
                            name: 'Health check',
                            status: 'passed',
                            duration_ms: 1000,
                            steps: 1,
                            error_message: null
                        },
                        {
                            name: 'Database connection',
                            status: 'passed',
                            duration_ms: 2000,
                            steps: 2,
                            error_message: null
                        },
                        {
                            name: 'External API',
                            status: 'failed',
                            duration_ms: 2000,
                            steps: 1,
                            error_message: 'Connection timeout'
                        }
                    ]
                }
            ]
        }, token);
        console.log('✅ Test Run Ingested:', ingestRes.data.run_id);

        // 6. Test Idempotency
        console.log('\n' + '='.repeat(70));
        const duplicateRes = await makeRequest('POST', '/ingest', {
            run_id: runId,
            environment: 'production',
            timestamp: new Date().toISOString(),
            summary: {
                total_test_cases: 3,
                passed: 2,
                failed: 1,
                flaky: 0,
                skipped: 0,
                duration_ms: 5000
            },
            test_suites: []
        }, token);
        console.log('✅ Idempotency Test:', duplicateRes.data.duplicate ? 'PASSED' : 'FAILED');

        console.log('\n' + '='.repeat(70));
        console.log('✅ Complete workflow test finished successfully!');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// =============================================================================
// MAIN - UNCOMMENT THE TEST YOU WANT TO RUN
// =============================================================================

async function main() {
    console.log('📝 Manual Testing Utility');
    console.log('Make sure the server is running on', BASE_URL);
    console.log('');

    // OPTION 1: Run complete workflow (recommended for first test)
    await runCompleteWorkflow();

    // OPTION 2: Run individual tests (uncomment as needed)
    await testHealthCheck();
    // await testCreateOrganization();
    // await testCreateProject('160ae8a8-2138-498e-8465-3e65178562bf');
    // await testCreateToken('1f57e4e2-956b-40ce-9493-ccc13ee95084');
    await testIngestTestRun('b24a6a36e512d663c975051ffb621f94ea259133ed204b547e19db6d6271f3a5');
    // await testInvalidToken();
    // await testValidationError();
}

// Run the tests
main().catch(console.error);
