const { ApiToken } = require('../models');

/**
 * Middleware to authenticate requests using Bearer token
 * Attaches projectId to req.auth if successful
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token is empty'
    });
  }

  try {
    // Use ApiToken model to authenticate
    const auth = await ApiToken.authenticate(token);

    if (!auth) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    // Attach project context to request
    req.auth = {
      tokenId: auth.tokenId,
      projectId: auth.projectId
    };

    return next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

module.exports = {
  authenticateToken
};
