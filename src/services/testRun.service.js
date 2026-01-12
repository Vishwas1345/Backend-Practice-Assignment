/**
 * Test Run Service
 * Business logic for test run ingestion
 */

const { TestRun } = require('../models');

/**
 * Ingest a test run with idempotency support
 * @param {Object} data - Test run data
 * @param {string} data.projectId - Project ID
 * @param {string} data.runId - Run ID
 * @param {string} data.status - Test status
 * @param {number} data.durationMs - Duration in milliseconds
 * @param {string} data.timestamp - ISO timestamp
 * @returns {Promise<Object>} Result object with success flag and data
 */
const ingestTestRun = async (data) => {
    const { projectId, runId, status, durationMs, timestamp } = data;

    try {
        await TestRun.create({
            projectId,
            runId,
            status,
            durationMs,
            timestamp
        });

        return {
            success: true,
            duplicate: false,
            runId,
            status
        };
    } catch (error) {
        // Handle idempotency: duplicate run_id
        if (error.message.includes('duplicate')) {
            return {
                success: true,
                duplicate: true,
                runId,
                status
            };
        }
        throw error;
    }
};

module.exports = {
    ingestTestRun
};
