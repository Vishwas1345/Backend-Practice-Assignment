/**
 * Models Index
 * Exports all models for easy importing
 */

const Organization = require('./Organization');
const Project = require('./Project');
const ApiToken = require('./ApiToken');
const TestRun = require('./TestRun');

module.exports = {
  Organization,
  Project,
  ApiToken,
  TestRun
};

