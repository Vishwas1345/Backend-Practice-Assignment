/**
 * Project Service
 * Business logic for project operations
 */

const { Project, Organization } = require('../models/index.model');

/**
 * Create a new project
 * @param {string} orgId - Organization ID
 * @param {string} name - Project name
 * @returns {Promise<Object>} Created project
 * @throws {Error} If organization not found or project creation fails
 */
const createProject = async (orgId, name) => {
    // Verify organization exists
    const org = await Organization.findById(orgId);
    if (!org) {
        const error = new Error('Organization not found');
        error.statusCode = 404;
        throw error;
    }

    try {
        const project = await Project.create(orgId, name);
        return project;
    } catch (error) {
        throw error;
    }
};

/**
 * Find project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Object|null>} Project or null if not found
 */
const findProjectById = async (id) => {
    return await Project.findById(id);
};

module.exports = {
    createProject,
    findProjectById
};
