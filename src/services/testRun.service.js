/**
 * Test Run Service
 * Business logic for test run ingestion
 */

const { TestRun } = require('../models');

/**
 * Ingest a test run with comprehensive test execution data
 * @param {Object} data - Test run data
 * @param {string} data.projectId - Project ID
 * @param {string} data.runId - Run ID (tr_ prefix)
 * @param {string} data.environment - Environment name
 * @param {string} data.timestamp - ISO timestamp
 * @param {Object} data.summary - Test execution summary
 * @param {Array} data.testSuites - Test suites with test cases
 * @returns {Promise<Object>} Result object with success flag and data
 */
const ingestTestRun = async (data) => {
    const { projectId, runId, environment, timestamp, summary, testSuites } = data;

    try {
        await TestRun.create({
            projectId,
            runId,
            environment,
            timestamp,
            summary,
            testSuites
        });

        return {
            success: true,
            duplicate: false,
            runId,
            environment,
            summary
        };
    } catch (error) {
        // Handle idempotency: duplicate run_id
        if (error.message.includes('duplicate')) {
            return {
                success: true,
                duplicate: true,
                runId,
                environment
            };
        }
        throw error;
    }
};

module.exports = {
    ingestTestRun
};
