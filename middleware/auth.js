const Auth = require('../models/Auth');

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.session_token;
    
    if (!sessionToken) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.redirect('/login');
    }

    const session = await Auth.findSession(sessionToken);
    
    if (!session) {
      res.clearCookie('session_token');
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      return res.redirect('/login');
    }

    // Attach user info to request
    req.user = {
      id: session.user_id,
      username: session.username,
      role: session.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    return res.redirect('/login');
  }
};

module.exports = { requireAuth };