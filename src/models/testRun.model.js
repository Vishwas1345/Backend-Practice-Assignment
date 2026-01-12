const { getDb } = require('../config/db.config');

/**
 * TestRun Model
 * Represents a comprehensive test run execution with detailed test case data
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
   * @param {string} data.runId - Unique run identifier (tr_ prefix)
   * @param {string} data.environment - Environment (e.g., 'staging', 'production')
   * @param {string} data.timestamp - ISO timestamp
   * @param {Object} data.summary - Test execution summary
   * @param {Array} data.testSuites - Array of test suites with test cases
   * @returns {Promise<Object>} Created test run
   */
  static async create({ projectId, runId, environment, timestamp, summary, testSuites }) {
    const testRun = {
      project_id: projectId,
      run_id: runId,
      environment: environment || 'unknown',
      timestamp,
      summary: {
        total_test_cases: summary.total_test_cases || 0,
        passed: summary.passed || 0,
        failed: summary.failed || 0,
        flaky: summary.flaky || 0,
        skipped: summary.skipped || 0,
        duration_ms: summary.duration_ms || 0
      },
      test_suites: testSuites || [],
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
   * Find test runs by environment
   * @param {string} projectId - Project ID
   * @param {string} environment - Environment name
   * @returns {Promise<Array>}
   */
  static async findByEnvironment(projectId, environment) {
    return await this.getCollection()
      .find({ project_id: projectId, environment })
      .toArray();
  }

  /**
   * Get test run statistics for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>}
   */
  static async getStats(projectId) {
    const pipeline = [
      { $match: { project_id: projectId } },
      {
        $group: {
          _id: null,
          total_runs: { $sum: 1 },
          total_test_cases: { $sum: '$summary.total_test_cases' },
          total_passed: { $sum: '$summary.passed' },
          total_failed: { $sum: '$summary.failed' },
          total_flaky: { $sum: '$summary.flaky' },
          total_skipped: { $sum: '$summary.skipped' },
          avg_duration: { $avg: '$summary.duration_ms' }
        }
      }
    ];

    const result = await this.getCollection().aggregate(pipeline).toArray();

    if (result.length === 0) {
      return {
        total_runs: 0,
        total_test_cases: 0,
        total_passed: 0,
        total_failed: 0,
        total_flaky: 0,
        total_skipped: 0,
        avg_duration: 0
      };
    }

    return result[0];
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
