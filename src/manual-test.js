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
        name: 'Vishwas Org12'
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
        name: 'My Test Project'
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
        run_id: `manual-test-${Date.now()}`,
        status: 'passed',
        duration_ms: 1500,
        timestamp: new Date().toISOString()
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
        status: 'passed',
        duration_ms: 1500,
        timestamp: new Date().toISOString()
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
        const runId = `run-${Date.now()}`;
        const ingestRes = await makeRequest('POST', '/ingest', {
            run_id: runId,
            status: 'passed',
            duration_ms: 1234,
            timestamp: new Date().toISOString()
        }, token);
        console.log('✅ Test Run Ingested:', ingestRes.data.run_id);

        // 6. Test Idempotency
        console.log('\n' + '='.repeat(70));
        const duplicateRes = await makeRequest('POST', '/ingest', {
            run_id: runId,
            status: 'passed',
            duration_ms: 1234,
            timestamp: new Date().toISOString()
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
    // await testHealthCheck();
    await testCreateOrganization();
    // await testCreateProject('YOUR_ORG_ID_HERE');
    // await testCreateToken('YOUR_PROJECT_ID_HERE');
    // await testIngestTestRun('YOUR_TOKEN_HERE');
    // await testInvalidToken();
    // await testValidationError();
}

// Run the tests
main().catch(console.error);
