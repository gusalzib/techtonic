
// Middleware to protect routes and check for roles
const jwt = require('jsonwebtoken');


// Role-based Auth Middleware
const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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