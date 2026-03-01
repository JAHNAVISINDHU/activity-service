/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err.message);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
