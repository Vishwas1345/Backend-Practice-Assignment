/**
 * Metrics Controller
 * Simple in-memory metrics tracking
 */

// In-memory counters (resets on server restart)
const metrics = {
    requests_total: 0,
    orgs_created: 0,
    projects_created: 0,
    tokens_created: 0,
    test_runs_ingested: 0,
    duplicate_runs_rejected: 0,
    errors: 0,
    startTime: Date.now()
};

/**
 * GET /metrics
 * Returns current metrics
 */
const getMetrics = (req, res) => {
    const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);

    res.json({
        uptime_seconds: uptime,
        counters: {
            requests_total: metrics.requests_total,
            orgs_created: metrics.orgs_created,
            projects_created: metrics.projects_created,
            tokens_created: metrics.tokens_created,
            test_runs_ingested: metrics.test_runs_ingested,
            duplicate_runs_rejected: metrics.duplicate_runs_rejected,
            errors: metrics.errors
        },
        timestamp: new Date().toISOString()
    });
};

/**
 * Increment a counter
 * @param {string} counter - Counter name
 */
const increment = (counter) => {
    if (metrics.hasOwnProperty(counter)) {
        metrics[counter]++;
    }
};

module.exports = {
    getMetrics,
    increment
};
