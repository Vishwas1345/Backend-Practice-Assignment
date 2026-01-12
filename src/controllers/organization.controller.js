/**
 * Organization Controller
 * Handles HTTP requests for organization operations
 */

const organizationService = require('../services/organization.service');
const { sendSuccess, sendError } = require('../utils/response.util');
const metricsController = require('./metrics.controller');

/**
 * Create a new organization
 * POST /orgs
 */
const createOrganization = async (req, res) => {
    const startTime = Date.now();

    try {
        const { name } = req.body;

        const organization = await organizationService.createOrganization(name);
        metricsController.increment('orgs_created');

        const duration = Date.now() - startTime;
        console.log(`[ORG_CREATED] org_id=${organization._id} name="${name}" duration=${duration}ms`);

        sendSuccess(res, 201, {
            id: organization._id,
            name: organization.name,
            message: 'Organization created successfully'
        });
    } catch (error) {
        if (error.message.includes('already exists')) {
            return sendError(res, 409, 'Conflict', error.message);
        }

        console.error('[ORG_CREATE_ERROR]', error);
        sendError(res, 500, 'Internal Server Error', 'Failed to create organization');
    }
};

module.exports = {
    createOrganization
};
