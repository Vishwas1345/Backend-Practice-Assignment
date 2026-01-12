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

    // Validate run_id
    if (!data.run_id || typeof data.run_id !== 'string') {
        errors.push('run_id is required and must be a string');
    } else if (data.run_id.trim().length === 0) {
        errors.push('run_id cannot be empty');
    } else if (!data.run_id.startsWith('tr_')) {
        errors.push('run_id must start with "tr_" prefix (e.g., tr_my_test_run_123)');
    } else if (data.run_id.length < 4) {
        errors.push('run_id must have at least one character after "tr_" prefix');
    }

    // Validate environment
    if (!data.environment || typeof data.environment !== 'string') {
        errors.push('environment is required and must be a string (e.g., "staging", "production")');
    }

    // Validate timestamp
    if (!data.timestamp || typeof data.timestamp !== 'string') {
        errors.push('timestamp is required and must be a string');
    } else {
        const date = new Date(data.timestamp);
        if (isNaN(date.getTime())) {
            errors.push('timestamp must be a valid ISO 8601 date string');
        }
    }

    // Validate summary
    if (!data.summary || typeof data.summary !== 'object') {
        errors.push('summary is required and must be an object');
    } else {
        const summary = data.summary;

        if (typeof summary.total_test_cases !== 'number' || summary.total_test_cases < 0) {
            errors.push('summary.total_test_cases must be a non-negative number');
        }
        if (typeof summary.passed !== 'number' || summary.passed < 0) {
            errors.push('summary.passed must be a non-negative number');
        }
        if (typeof summary.failed !== 'number' || summary.failed < 0) {
            errors.push('summary.failed must be a non-negative number');
        }
        if (typeof summary.flaky !== 'number' || summary.flaky < 0) {
            errors.push('summary.flaky must be a non-negative number');
        }
        if (typeof summary.skipped !== 'number' || summary.skipped < 0) {
            errors.push('summary.skipped must be a non-negative number');
        }
        if (typeof summary.duration_ms !== 'number' || summary.duration_ms < 0) {
            errors.push('summary.duration_ms must be a non-negative number');
        }
    }

    // Validate test_suites (optional but must be array if provided)
    if (data.test_suites !== undefined) {
        if (!Array.isArray(data.test_suites)) {
            errors.push('test_suites must be an array');
        } else {
            data.test_suites.forEach((suite, suiteIndex) => {
                if (!suite.suite_name || typeof suite.suite_name !== 'string') {
                    errors.push(`test_suites[${suiteIndex}].suite_name is required and must be a string`);
                }
                if (typeof suite.total_cases !== 'number' || suite.total_cases < 0) {
                    errors.push(`test_suites[${suiteIndex}].total_cases must be a non-negative number`);
                }
                if (typeof suite.passed !== 'number' || suite.passed < 0) {
                    errors.push(`test_suites[${suiteIndex}].passed must be a non-negative number`);
                }
                if (typeof suite.failed !== 'number' || suite.failed < 0) {
                    errors.push(`test_suites[${suiteIndex}].failed must be a non-negative number`);
                }
                if (typeof suite.duration_ms !== 'number' || suite.duration_ms < 0) {
                    errors.push(`test_suites[${suiteIndex}].duration_ms must be a non-negative number`);
                }

                // Validate test_cases within suite
                if (suite.test_cases !== undefined) {
                    if (!Array.isArray(suite.test_cases)) {
                        errors.push(`test_suites[${suiteIndex}].test_cases must be an array`);
                    } else {
                        suite.test_cases.forEach((testCase, caseIndex) => {
                            if (!testCase.name || typeof testCase.name !== 'string') {
                                errors.push(`test_suites[${suiteIndex}].test_cases[${caseIndex}].name is required`);
                            }
                            if (!['passed', 'failed', 'flaky', 'skipped'].includes(testCase.status)) {
                                errors.push(`test_suites[${suiteIndex}].test_cases[${caseIndex}].status must be one of: passed, failed, flaky, skipped`);
                            }
                            if (typeof testCase.duration_ms !== 'number' || testCase.duration_ms < 0) {
                                errors.push(`test_suites[${suiteIndex}].test_cases[${caseIndex}].duration_ms must be a non-negative number`);
                            }
                        });
                    }
                }
            });
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
