/**
 * Token Controller
 * Handles HTTP requests for API token operations
 */

const tokenService = require('../services/token.service');
const { sendSuccess, sendError } = require('../utils/response.util');

/**
 * Create a new API token
 * POST /tokens
 */
const createToken = async (req, res) => {
    const startTime = Date.now();

    try {
        const { project_id } = req.body;

        const result = await tokenService.createToken(project_id);

        const duration = Date.now() - startTime;
        console.log(`[TOKEN_CREATED] token_id=${result.id} project_id=${project_id} duration=${duration}ms`);

        sendSuccess(res, 201, {
            id: result.id,
            project_id: result.project_id,
            token: result.token,
            message: 'API token created successfully. Save this token - it will not be shown again!'
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return sendError(res, 404, 'Not Found', error.message);
        }

        console.error('[TOKEN_CREATE_ERROR]', error);
        sendError(res, 500, 'Internal Server Error', 'Failed to create token');
    }
};

module.exports = {
    createToken
};
