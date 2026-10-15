/**
 * Wraps a route handler so anything it throws or rejects with reaches the
 * error middleware, sparing every handler its own try/catch.
 */
function asyncHandler(handler) {
  return async function handle(req, res, next) {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = asyncHandler;
