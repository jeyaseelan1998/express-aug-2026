const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Normalises page/limit query params into safe, clamped values. */
function paginationFrom({ page, limit } = {}) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page: currentPage, limit: perPage, skip: (currentPage - 1) * perPage };
}

/** Builds the meta block every paginated list response returns. */
function pageMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

module.exports = { paginationFrom, pageMeta, DEFAULT_LIMIT, MAX_LIMIT };
