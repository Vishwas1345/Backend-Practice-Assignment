/**
 * Token Service
 * Business logic for API token operations
 */

const { ApiToken, Project } = require('../models/index.model');

/**
 * Create a new API token
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Created token with raw token value
 * @throws {Error} If project not found or token creation fails
 */
const createToken = async (projectId, name) => {
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    const result = await ApiToken.create(projectId, name);
    return result;
};

module.exports = {
    createToken
};
