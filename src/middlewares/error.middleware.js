function notFound(req, res) {
  res.status(404).json({ error: 'Not Found' });
}

function errorHandler(err, req, res, _next) {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };
