/**
 * Mock Test Data Generator
 * Creates realistic but simple test execution data for testing
 */

/**
 * Generate mock test run data with comprehensive structure
 * @param {string} runId - Test run ID
 * @returns {Object} Complete test run data
 */
function generateMockTestRun(runId) {
    return {
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
                    },
                    {
                        name: 'should fetch user details',
                        status: 'passed',
                        duration_ms: 1200,
                        steps: 2,
                        error_message: null
                    }
                ]
            },
            {
                suite_name: 'API Integration Tests',
                total_cases: 2,
                passed: 1,
                failed: 1,
                duration_ms: 5420,
                test_cases: [
                    {
                        name: 'should fetch data from external API',
                        status: 'passed',
                        duration_ms: 3200,
                        steps: 5,
                        error_message: null
                    },
                    {
                        name: 'should handle API rate limiting',
                        status: 'failed',
                        duration_ms: 2220,
                        steps: 3,
                        error_message: 'Rate limit not properly enforced'
                    }
                ]
            }
        ]
    };
}

module.exports = {
    generateMockTestRun
};
