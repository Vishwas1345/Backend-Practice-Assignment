const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * ApiToken Model
 * Represents API tokens for authentication
 */
class ApiToken {
  /**
   * Get collection name
   */
  static get collectionName() {
    return 'api_tokens';
  }

  /**
   * Get the MongoDB collection
   */
  static getCollection() {
    return getDb().collection(this.collectionName);
  }

  /**
   * Generate a secure random token
   * @returns {string} 64-character hex string
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a token for secure storage
   * @param {string} token - Raw token
   * @returns {Promise<string>} Hashed token
   */
  static async hashToken(token) {
    return bcrypt.hash(token, SALT_ROUNDS);
  }

  /**
   * Verify a token against a hash
   * @param {string} token - Raw token
   * @param {string} hash - Stored hash
   * @returns {Promise<boolean>}
   */
  static async verifyToken(token, hash) {
    return bcrypt.compare(token, hash);
  }

  /**
   * Create a new API token
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} { id, project_id, token, token_hash }
   */
  static async create(projectId) {
    const tokenId = uuidv4();
    const rawToken = this.generateToken();
    const tokenHash = await this.hashToken(rawToken);

    const apiToken = {
      _id: tokenId,
      project_id: projectId,
      token_hash: tokenHash,
      created_at: new Date()
    };

    await this.getCollection().insertOne(apiToken);

    return {
      id: tokenId,
      project_id: projectId,
      token: rawToken, // Raw token returned only once!
      token_hash: tokenHash
    };
  }

  /**
   * Find token by ID
   * @param {string} id - Token ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    return await this.getCollection().findOne({ _id: id });
  }

  /**
   * Find tokens by project ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>}
   */
  static async findByProjectId(projectId) {
    return await this.getCollection().find({ project_id: projectId }).toArray();
  }

  /**
   * Find all tokens
   * @returns {Promise<Array>}
   */
  static async findAll() {
    return await this.getCollection().find({}).toArray();
  }

  /**
   * Verify token and get associated project ID
   * @param {string} token - Raw token to verify
   * @returns {Promise<Object|null>} { tokenId, projectId } or null
   */
  static async authenticate(token) {
    const tokens = await this.findAll();

    for (const storedToken of tokens) {
      const isValid = await this.verifyToken(token, storedToken.token_hash);
      if (isValid) {
        return {
          tokenId: storedToken._id,
          projectId: storedToken.project_id
        };
      }
    }

    return null;
  }

  /**
   * Delete token
   * @param {string} id - Token ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await this.getCollection().deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /**
   * Count tokens for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>}
   */
  static async countByProject(projectId) {
    return await this.getCollection().countDocuments({ project_id: projectId });
  }

  /**
   * Count total tokens
   * @returns {Promise<number>}
   */
  static async count() {
    return await this.getCollection().countDocuments();
  }
}

module.exports = ApiToken;

