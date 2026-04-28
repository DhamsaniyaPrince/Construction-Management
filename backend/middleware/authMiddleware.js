const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// backend/middleware/authMiddleware.js

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('🔍 AuthorizeRoles check:');
    console.log('   User ID:', req.user._id);
    console.log('   User role:', req.user.role);
    console.log('   Required roles:', roles);
    console.log('   User email:', req.user.email);
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ Access denied for role:', req.user.role);
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}, Current role: ${req.user.role}`
      });
    }
    console.log('✅ Access granted for role:', req.user.role);
    next();
  };
};

module.exports = { protect, authorizeRoles };
