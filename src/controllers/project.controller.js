/**
 * Project Controller
 * Handles HTTP requests for project operations
 */

const projectService = require('../services/project.service');
const { sendSuccess, sendError } = require('../utils/response.util');
const metricsController = require('./metrics.controller');

/**
 * Create a new project
 * POST /projects
 */
const createProject = async (req, res) => {
    const startTime = Date.now();

    try {
        const { org_id, name } = req.body;

        const project = await projectService.createProject(org_id, name);
        metricsController.increment('projects_created');

        const duration = Date.now() - startTime;
        console.log(`[PROJECT_CREATED] project_id=${project._id} org_id=${org_id} name="${name}" duration=${duration}ms`);

        sendSuccess(res, 201, {
            id: project._id,
            org_id: project.org_id,
            name: project.name,
            message: 'Project created successfully'
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return sendError(res, 404, 'Not Found', error.message);
        }

        if (error.message.includes('already exists')) {
            return sendError(res, 409, 'Conflict', error.message);
        }

        console.error('[PROJECT_CREATE_ERROR]', error);
        sendError(res, 500, 'Internal Server Error', 'Failed to create project');
    }
};

module.exports = {
    createProject
};
