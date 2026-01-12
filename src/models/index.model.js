/**
 * Models Index
 * Central export point for all models
 */

const Organization = require('./organization.model');
const Project = require('./project.model');
const ApiToken = require('./apiToken.model');
const TestRun = require('./testRun.model');

module.exports = {
  Organization,
  Project,
  ApiToken,
  TestRun
};
