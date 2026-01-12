const { getDb } = require('../db');

/**
 * TestRun Model
 * Represents a test run execution
 */
class TestRun {
  /**
   * Get collection name
   */
  static get collectionName() {
    return 'test_runs';
  }

  /**
   * Get the MongoDB collection
   */
  static getCollection() {
    return getDb().collection(this.collectionName);
  }

  /**
   * Create a new test run
   * @param {Object} data - Test run data
   * @param {string} data.projectId - Project ID
   * @param {string} data.runId - Unique run identifier
   * @param {string} data.status - 'passed' or 'failed'
   * @param {number} data.durationMs - Duration in milliseconds
   * @param {string} data.timestamp - ISO timestamp
   * @returns {Promise<Object>} Created test run
   */
  static async create({ projectId, runId, status, durationMs, timestamp }) {
    const testRun = {
      project_id: projectId,
      run_id: runId,
      status,
      duration_ms: durationMs,
      timestamp,
      created_at: new Date()
    };

    try {
      const result = await this.getCollection().insertOne(testRun);
      return { ...testRun, _id: result.insertedId };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Test run with this run_id already exists (duplicate)');
      }
      throw error;
    }
  }

  /**
   * Find test run by ID
   * @param {string} id - Test run ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    return await this.getCollection().findOne({ _id: id });
  }

  /**
   * Find test run by project and run ID
   * @param {string} projectId - Project ID
   * @param {string} runId - Run ID
   * @returns {Promise<Object|null>}
   */
  static async findByProjectAndRunId(projectId, runId) {
    return await this.getCollection().findOne({ 
      project_id: projectId, 
      run_id: runId 
    });
  }

  /**
   * Find test runs by project ID
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Max results
   * @param {number} options.skip - Skip results
   * @param {Object} options.sort - Sort options
   * @returns {Promise<Array>}
   */
  static async findByProjectId(projectId, options = {}) {
    const { limit = 100, skip = 0, sort = { created_at: -1 } } = options;
    
    return await this.getCollection()
      .find({ project_id: projectId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Find test runs by status
   * @param {string} projectId - Project ID
   * @param {string} status - 'passed' or 'failed'
   * @returns {Promise<Array>}
   */
  static async findByStatus(projectId, status) {
    return await this.getCollection()
      .find({ project_id: projectId, status })
      .toArray();
  }

  /**
   * Find test runs in date range
   * @param {string} projectId - Project ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>}
   */
  static async findByDateRange(projectId, startDate, endDate) {
    return await this.getCollection()
      .find({ 
        project_id: projectId,
        timestamp: { 
          $gte: startDate.toISOString(), 
          $lte: endDate.toISOString() 
        }
      })
      .toArray();
  }

  /**
   * Get test run statistics for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} { total, passed, failed, avgDuration }
   */
  static async getStats(projectId) {
    const pipeline = [
      { $match: { project_id: projectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          passed: { 
            $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] } 
          },
          failed: { 
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } 
          },
          avgDuration: { $avg: '$duration_ms' },
          minDuration: { $min: '$duration_ms' },
          maxDuration: { $max: '$duration_ms' }
        }
      }
    ];

    const result = await this.getCollection().aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0
      };
    }

    return result[0];
  }

  /**
   * Find all test runs
   * @returns {Promise<Array>}
   */
  static async findAll() {
    return await this.getCollection().find({}).toArray();
  }

  /**
   * Update test run
   * @param {string} id - Test run ID
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
   * Delete test run
   * @param {string} id - Test run ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await this.getCollection().deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /**
   * Count test runs for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>}
   */
  static async countByProject(projectId) {
    return await this.getCollection().countDocuments({ project_id: projectId });
  }

  /**
   * Count total test runs
   * @returns {Promise<number>}
   */
  static async count() {
    return await this.getCollection().countDocuments();
  }

  /**
   * Delete all test runs for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>} Number of deleted documents
   */
  static async deleteByProject(projectId) {
    const result = await this.getCollection().deleteMany({ project_id: projectId });
    return result.deletedCount;
  }
}

module.exports = TestRun;

