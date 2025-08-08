const jwt = require('jsonwebtoken');

const instructorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Instructor role required.' });
  }
};

const auth = function(req, res, next) {
  // Get token from header
  let token = req.header('Authorization');

  // Check if token exists and is in 'Bearer <token>' format
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { auth, instructorOnly };
