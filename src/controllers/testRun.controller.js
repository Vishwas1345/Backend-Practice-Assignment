/**
 * Test Run Controller
 * Handles HTTP requests for test run ingestion
 */

const testRunService = require('../services/testRun.service');
const { sendSuccess, sendError } = require('../utils/response.util');

/**
 * Ingest a test run
 * POST /ingest
 */
const ingestTestRun = async (req, res) => {
    const startTime = Date.now();

    try {
        const { run_id, status, duration_ms, timestamp } = req.body;
        const { projectId } = req.auth;

        const result = await testRunService.ingestTestRun({
            projectId,
            runId: run_id,
            status,
            durationMs: duration_ms,
            timestamp
        });

        const duration = Date.now() - startTime;

        if (result.duplicate) {
            console.log(`[DUPLICATE_RUN_REJECTED] project_id=${projectId} run_id=${run_id} duration=${duration}ms`);

            // Return 200 (not 409) to make retry safe
            return sendSuccess(res, 200, {
                message: 'Test run already exists (idempotent)',
                run_id,
                duplicate: true
            });
        }

        console.log(`[TEST_RUN_INGESTED] project_id=${projectId} run_id=${run_id} status=${status} duration=${duration}ms`);

        sendSuccess(res, 201, {
            message: 'Test run ingested successfully',
            run_id,
            status
        });
    } catch (error) {
        console.error('[INGEST_ERROR]', error);
        sendError(res, 500, 'Internal Server Error', 'Failed to ingest test run');
    }
};

module.exports = {
    ingestTestRun
};
