const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`Access denied for role: ${req.user.role}. Required roles: ${roles.join(', ')}`);
      return res.status(403).json({ 
        message: "Access denied",
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = authorize;
