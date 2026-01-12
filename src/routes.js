const express = require('express');
const { authenticateToken } = require('./auth');
const { 
  validateOrganization, 
  validateProject, 
  validateToken, 
  validateTestRun 
} = require('./validation');
const { Organization, Project, ApiToken, TestRun } = require('./models');

const router = express.Router();

// Metrics tracking
let metrics = {
  orgs_created: 0,
  projects_created: 0,
  tokens_created: 0,
  test_runs_ingested: 0,
  duplicate_runs_rejected: 0,
  requests_total: 0
};

/**
 * GET /metrics - Simple metrics endpoint
 */
router.get('/metrics', (req, res) => {
  res.json(metrics);
});

/**
 * POST /orgs - Create a new organization
 */
router.post('/orgs', async (req, res) => {
  metrics.requests_total++;
  const startTime = Date.now();
  
  try {
    const errors = validateOrganization(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors 
      });
    }

    const { name } = req.body;

    try {
      const organization = await Organization.create(name);
      metrics.orgs_created++;
      
      const duration = Date.now() - startTime;
      console.log(`[ORG_CREATED] org_id=${organization._id} name="${name}" duration=${duration}ms`);
      
      res.status(201).json({ 
        id: organization._id, 
        name: organization.name,
        message: 'Organization created successfully'
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('[ORG_CREATE_ERROR]', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to create organization' 
    });
  }
});

/**
 * POST /projects - Create a new project
 */
router.post('/projects', async (req, res) => {
  metrics.requests_total++;
  const startTime = Date.now();
  
  try {
    const errors = validateProject(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors 
      });
    }

    const { org_id, name } = req.body;
    
    // Verify organization exists
    const org = await Organization.findById(org_id);
    if (!org) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Organization not found' 
      });
    }

    try {
      const project = await Project.create(org_id, name);
      metrics.projects_created++;
      
      const duration = Date.now() - startTime;
      console.log(`[PROJECT_CREATED] project_id=${project._id} org_id=${org_id} name="${name}" duration=${duration}ms`);
      
      res.status(201).json({ 
        id: project._id, 
        org_id: project.org_id,
        name: project.name,
        message: 'Project created successfully'
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('[PROJECT_CREATE_ERROR]', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to create project' 
    });
  }
});

/**
 * POST /tokens - Create a new API token
 * Returns the raw token only once
 */
router.post('/tokens', async (req, res) => {
  metrics.requests_total++;
  const startTime = Date.now();
  
  try {
    const errors = validateToken(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors 
      });
    }

    const { project_id } = req.body;
    
    // Verify project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Project not found' 
      });
    }

    const result = await ApiToken.create(project_id);
    
    metrics.tokens_created++;
    
    const duration = Date.now() - startTime;
    console.log(`[TOKEN_CREATED] token_id=${result.id} project_id=${project_id} duration=${duration}ms`);
    
    res.status(201).json({ 
      id: result.id,
      project_id: result.project_id,
      token: result.token,
      message: 'API token created successfully. Save this token - it will not be shown again!'
    });
  } catch (error) {
    console.error('[TOKEN_CREATE_ERROR]', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to create token' 
    });
  }
});

/**
 * POST /ingest - Ingest test results (requires authentication)
 */
router.post('/ingest', authenticateToken, async (req, res) => {
  metrics.requests_total++;
  const startTime = Date.now();
  
  try {
    const errors = validateTestRun(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors 
      });
    }

    const { run_id, status, duration_ms, timestamp } = req.body;
    const { projectId } = req.auth;

    // Idempotency: Try to insert, handle duplicate gracefully
    try {
      await TestRun.create({
        projectId,
        runId: run_id,
        status,
        durationMs: duration_ms,
        timestamp
      });
      
      metrics.test_runs_ingested++;
      
      const duration = Date.now() - startTime;
      console.log(`[TEST_RUN_INGESTED] project_id=${projectId} run_id=${run_id} status=${status} duration=${duration}ms`);
      
      res.status(201).json({ 
        message: 'Test run ingested successfully',
        run_id,
        status
      });
    } catch (error) {
      // Handle idempotency: duplicate run_id
      if (error.message.includes('duplicate')) {
        metrics.duplicate_runs_rejected++;
        
        const duration = Date.now() - startTime;
        console.log(`[DUPLICATE_RUN_REJECTED] project_id=${projectId} run_id=${run_id} duration=${duration}ms`);
        
        // Return 200 (not 409) to make retry safe
        return res.status(200).json({ 
          message: 'Test run already exists (idempotent)',
          run_id,
          duplicate: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('[INGEST_ERROR]', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to ingest test run' 
    });
  }
});

/**
 * GET /health - Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
