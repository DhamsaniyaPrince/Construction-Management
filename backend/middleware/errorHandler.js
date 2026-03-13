// Centralized error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err); // keep simple logging; can swap with logger util

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
