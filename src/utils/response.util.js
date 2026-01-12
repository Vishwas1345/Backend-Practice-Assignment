/**
 * Response utility functions for standardized API responses
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
const sendSuccess = (res, statusCode, data) => {
    res.status(statusCode).json(data);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error type
 * @param {string} message - Error message
 */
const sendError = (res, statusCode, error, message) => {
    res.status(statusCode).json({
        error,
        message
    });
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
const sendValidationError = (res, errors) => {
    res.status(400).json({
        error: 'Validation Error',
        details: errors
    });
};

module.exports = {
    sendSuccess,
    sendError,
    sendValidationError
};
