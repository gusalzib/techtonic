
// Middleware to protect routes and check for roles
const jwt = require('jsonwebtoken');


// Role-based Auth Middleware
const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: 'No token provided' });
      console.warn('[checkAuth] No Authorization header');
      const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('[checkAuth] Token verified for user:', decoded.username);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ msg: 'Access denied: insufficient role' });
      }

      req.user = decoded; // attach user info to the request
      next();
    } catch {
      res.status(401).json({ msg: 'Invalid token' });
    }
  };
};



// Middleware to check the token
const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// Route to check if the user is logged in and get their role
const getUserStatus = (req, res) => {
  const { user } = req; // From the middleware (decoded user)

  // Return user details and role flags
    res.status(200).json({
        isLoggedIn: true,  // User is authenticated, so we set this flag to true.
        isAdmin: user.role === 'admin',  // This checks if the user's role is 'admin' and returns true/false.
        isRegular: user.role === 'regular',  // This checks if the user's role is 'regular' and returns true/false.
        isPaid: user.role === 'paid',  // This checks if the user's role is 'paid' and returns true/false.
        username: user.username,  // The user's username is returned as part of the response.
        timezone: user.userTz,
    });
};

module.exports = {
    checkAuth, 
    getUserStatus,
    authMiddleware,
  
};