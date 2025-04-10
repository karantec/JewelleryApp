// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied, token missing' });
  }

  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded Token:', decoded);

    if (!decoded || !decoded._id) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    req.user = decoded; // attach user to request
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = { verifyToken };
