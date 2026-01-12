const bcrypt = require('bcrypt');
const { dbAll } = require('./db-helpers');

const SALT_ROUNDS = 10;

/**
 * Hash an API token for secure storage
 */
async function hashToken(token) {
  return bcrypt.hash(token, SALT_ROUNDS);
}

/**
 * Verify a token against a stored hash
 */
async function verifyToken(token, hash) {
  return bcrypt.compare(token, hash);
}

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
    // Get all token hashes from database
    const tokens = await dbAll('SELECT id, project_id, token_hash FROM api_tokens');
    
    // Try to match token against stored hashes
    // Note: This is a potential performance bottleneck - see README for scaling discussion
    for (const storedToken of tokens) {
      const isValid = await verifyToken(token, storedToken.token_hash);
      if (isValid) {
        // Attach project context to request
        req.auth = {
          tokenId: storedToken.id,
          projectId: storedToken.project_id
        };
        return next();
      }
    }
    
    // No matching token found
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid token' 
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Authentication failed' 
    });
  }
}

module.exports = {
  hashToken,
  verifyToken,
  authenticateToken
};

