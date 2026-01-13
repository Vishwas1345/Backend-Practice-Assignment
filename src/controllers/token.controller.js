/**
 * Token Controller
 * Handles HTTP requests for API token operations
 */

const tokenService = require('../services/token.service');
const { sendSuccess, sendError } = require('../utils/response.util');
const metricsController = require('./metrics.controller');

/**
 * Create a new API token
 * POST /tokens
 */
const createToken = async (req, res) => {
    const startTime = Date.now();

    try {
        const { project_id, name } = req.body;

        if (!name) {
            return sendError(res, 400, 'Bad Request', 'Token name is required');
        }

        const result = await tokenService.createToken(project_id, name);
        metricsController.increment('tokens_created');

        const duration = Date.now() - startTime;
        console.log(`[TOKEN_CREATED] token_id=${result.id} project_id=${project_id} name="${name}" duration=${duration}ms`);

        sendSuccess(res, 201, {
            project_id: result.project_id,
            name: result.name,
            token: result.token,
            message: 'API token created successfully. Save this token - it will not be shown again!'
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return sendError(res, 404, 'Not Found', error.message);
        }
        if (error.message.includes('already exists')) {
            return sendError(res, 409, 'Conflict', error.message);
        }

        console.error('[TOKEN_CREATE_ERROR]', error);
        sendError(res, 500, 'Internal Server Error', 'Failed to create token');
    }
};

module.exports = {
    createToken
};
