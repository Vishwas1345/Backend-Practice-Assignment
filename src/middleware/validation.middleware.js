/**
 * Validation Middleware
 * Express middleware for request validation with built-in validation logic
 */

const { sendValidationError } = require('../utils/response.util');

/**
 * Validation function for organization data
 */
function validateOrganization(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('name is required and must be a string');
    } else if (data.name.trim().length === 0) {
        errors.push('name cannot be empty');
    } else if (data.name.length > 255) {
        errors.push('name must be less than 255 characters');
    }
    return errors;
}

/**
 * Validation function for project data
 */
function validateProject(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('name is required and must be a string');
    } else if (data.name.trim().length === 0) {
        errors.push('name cannot be empty');
    } else if (data.name.length > 255) {
        errors.push('name must be less than 255 characters');
    }

    if (!data.org_id || typeof data.org_id !== 'string') {
        errors.push('org_id is required and must be a string');
    }

    return errors;
}

/**
 * Validation function for token data
 */
function validateToken(data) {
    const errors = [];

    if (!data.project_id || typeof data.project_id !== 'string') {
        errors.push('project_id is required and must be a string');
    }

    return errors;
}

/**
 * Validation function for test run data
 */
function validateTestRun(data) {
    const errors = [];

    if (!data.run_id || typeof data.run_id !== 'string') {
        errors.push('run_id is required and must be a string');
    } else if (data.run_id.trim().length === 0) {
        errors.push('run_id cannot be empty');
    } else if (!data.run_id.startsWith('tr_')) {
        errors.push('run_id must start with "tr_" prefix (e.g., tr_my_test_run_123)');
    } else if (data.run_id.length < 4) {
        errors.push('run_id must have at least one character after "tr_" prefix');
    }

    if (!data.status || !['passed', 'failed'].includes(data.status)) {
        errors.push('status is required and must be either "passed" or "failed"');
    }

    if (data.duration_ms === undefined || data.duration_ms === null) {
        errors.push('duration_ms is required');
    } else if (typeof data.duration_ms !== 'number' || data.duration_ms < 0) {
        errors.push('duration_ms must be a non-negative number');
    }

    if (!data.timestamp || typeof data.timestamp !== 'string') {
        errors.push('timestamp is required and must be a string');
    } else {
        // Validate ISO 8601 format
        const date = new Date(data.timestamp);
        if (isNaN(date.getTime())) {
            errors.push('timestamp must be a valid ISO 8601 date string');
        }
    }

    return errors;
}

/**
 * Middleware to validate organization input
 */
const validateOrganizationInput = (req, res, next) => {
    const errors = validateOrganization(req.body);
    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }
    next();
};

/**
 * Middleware to validate project input
 */
const validateProjectInput = (req, res, next) => {
    const errors = validateProject(req.body);
    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }
    next();
};

/**
 * Middleware to validate token input
 */
const validateTokenInput = (req, res, next) => {
    const errors = validateToken(req.body);
    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }
    next();
};

/**
 * Middleware to validate test run input
 */
const validateTestRunInput = (req, res, next) => {
    const errors = validateTestRun(req.body);
    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }
    next();
};

module.exports = {
    validateOrganizationInput,
    validateProjectInput,
    validateTokenInput,
    validateTestRunInput
};
