function notFound(req, res) {
  res.status(404).json({ error: 'Not Found' });
}

function errorHandler(err, req, res, _next) {
  console.error(err.stack);

  // Unique-index violation: name the field that collided.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({
      error: field ? `A record with this ${field} already exists` : 'Duplicate value',
    });
  }

  // Schema validation, e.g. a non-hex colour code or a discount above 100.
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => ({ path: e.path, msg: e.message })),
    });
  }

  // A malformed ObjectId reaching a query.
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }

  const statusCode = err.statusCode || (err.name === 'MulterError' ? 400 : 500);
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };
