const { getDb } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

/**
 * Project Model
 * Represents a project within an organization
 */
class Project {
  /**
   * Get collection name
   */
  static get collectionName() {
    return 'projects';
  }

  /**
   * Get the MongoDB collection
   */
  static getCollection() {
    return getDb().collection(this.collectionName);
  }

  /**
   * Create a new project
   * @param {string} orgId - Organization ID
   * @param {string} name - Project name
   * @returns {Promise<Object>} Created project
   */
  static async create(orgId, name) {
    const project = {
      _id: `proj_${uuidv4()}`,
      org_id: orgId,
      name,
      created_at: new Date()
    };

    try {
      await this.getCollection().insertOne(project);
      return project;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Project with this name already exists in the organization');
      }
      throw error;
    }
  }

  /**
   * Find project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    return await this.getCollection().findOne({ _id: id });
  }

  /**
   * Find projects by organization ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>}
   */
  static async findByOrgId(orgId) {
    return await this.getCollection().find({ org_id: orgId }).toArray();
  }

  /**
   * Find project by organization and name
   * @param {string} orgId - Organization ID
   * @param {string} name - Project name
   * @returns {Promise<Object|null>}
   */
  static async findByOrgAndName(orgId, name) {
    return await this.getCollection().findOne({ org_id: orgId, name });
  }

  /**
   * Find all projects
   * @returns {Promise<Array>}
   */
  static async findAll() {
    return await this.getCollection().find({}).toArray();
  }

  /**
   * Update project
   * @param {string} id - Project ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>}
   */
  static async update(id, updates) {
    const result = await this.getCollection().findOneAndUpdate(
      { _id: id },
      { $set: { ...updates, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  /**
   * Delete project
   * @param {string} id - Project ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await this.getCollection().deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /**
   * Count projects in an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<number>}
   */
  static async countByOrg(orgId) {
    return await this.getCollection().countDocuments({ org_id: orgId });
  }

  /**
   * Count total projects
   * @returns {Promise<number>}
   */
  static async count() {
    return await this.getCollection().countDocuments();
  }
}

module.exports = Project;

