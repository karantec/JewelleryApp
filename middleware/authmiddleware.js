// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Use JWT secret from .env (fallback for development)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const verifyToken = (req, res, next) => {
  // Expect the token in the Authorization header (e.g., "Bearer <token>")
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: 'Access denied, token missing' });
  }

  // If using "Bearer <token>" format, split to get the token value
  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains the userId field
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyToken };
