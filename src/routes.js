const express = require('express');
const { authenticateToken } = require('./middleware/auth.middleware');
const organizationController = require('./controllers/organization.controller');
const projectController = require('./controllers/project.controller');
const tokenController = require('./controllers/token.controller');
const testRunController = require('./controllers/testRun.controller');
const {
  validateOrganizationInput,
  validateProjectInput,
  validateTokenInput,
  validateTestRunInput
} = require('./middleware/validation.middleware');
const metricsController = require('./controllers/metrics.controller');
const router = express.Router();

/**
 * POST /orgs - Create a new organization
 */
router.post('/orgs', validateOrganizationInput, organizationController.createOrganization);

/**
 * POST /projects - Create a new project
 */
router.post('/projects', validateProjectInput, projectController.createProject);

/**
 * POST /tokens - Create a new API token
 * Returns the raw token only once
 */
router.post('/tokens', validateTokenInput, tokenController.createToken);

/**
 * POST /ingest - Ingest test results (requires authentication)
 */
router.post('/ingest', authenticateToken, validateTestRunInput, testRunController.ingestTestRun);

/**
 * GET /health - Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /metrics - API usage metrics
 */

router.get('/metrics', metricsController.getMetrics);

module.exports = router;
