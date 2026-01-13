const { getDb } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

/**
 * Organization Model
 * Represents a top-level organization/company
 */
class Organization {
  /**
   * Get collection name
   */
  static get collectionName() {
    return 'organizations';
  }

  /**
   * Get the MongoDB collection
   */
  static getCollection() {
    return getDb().collection(this.collectionName);
  }

  /**
   * Create a new organization
   * @param {string} name - Organization name
   * @returns {Promise<Object>} Created organization
   */
  static async create(name) {
    const organization = {
      _id: `org_${uuidv4()}`,
      name,
      created_at: new Date()
    };

    try {
      await this.getCollection().insertOne(organization);
      return organization;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Organization with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Find organization by ID
   * @param {string} id - Organization ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    return await this.getCollection().findOne({ _id: id });
  }

  /**
   * Find organization by name
   * @param {string} name - Organization name
   * @returns {Promise<Object|null>}
   */
  static async findByName(name) {
    return await this.getCollection().findOne({ name });
  }

  /**
   * Find all organizations
   * @returns {Promise<Array>}
   */
  static async findAll() {
    return await this.getCollection().find({}).toArray();
  }

  /**
   * Update organization
   * @param {string} id - Organization ID
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
   * Delete organization
   * @param {string} id - Organization ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await this.getCollection().deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /**
   * Count total organizations
   * @returns {Promise<number>}
   */
  static async count() {
    return await this.getCollection().countDocuments();
  }
}

module.exports = Organization;

