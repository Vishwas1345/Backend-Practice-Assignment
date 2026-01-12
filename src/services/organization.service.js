/**
 * Organization Service
 * Business logic for organization operations
 */

const { Organization } = require('../models');

/**
 * Create a new organization
 * @param {string} name - Organization name
 * @returns {Promise<Object>} Created organization
 * @throws {Error} If organization already exists or creation fails
 */
const createOrganization = async (name) => {
    try {
        const organization = await Organization.create(name);
        return organization;
    } catch (error) {
        // Re-throw with context
        throw error;
    }
};

/**
 * Find organization by ID
 * @param {string} id - Organization ID
 * @returns {Promise<Object|null>} Organization or null if not found
 */
const findOrganizationById = async (id) => {
    return await Organization.findById(id);
};

module.exports = {
    createOrganization,
    findOrganizationById
};
