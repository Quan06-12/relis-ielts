export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500
  let code = err.code
  if (err.type === 'entity.parse.failed') {
    status = 400
    code = 'INVALID_JSON'
  }
  if (err.type === 'entity.too.large') {
    status = 413
    code = 'FILE_TOO_LARGE'
  }
  if (
    ['MongoServerSelectionError', 'MongoNetworkError', 'MongooseServerSelectionError'].includes(
      err.name,
    )
  ) {
    status = 503
    code = 'DATABASE_UNAVAILABLE'
  }
  if (status >= 500) console.error(err.name, err.code || 'INTERNAL_ERROR')
  res
    .status(status)
    .json({
      error: {
        code: typeof code === 'string' ? code : 'INTERNAL_ERROR',
        message: status >= 500 ? 'Service unavailable' : err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    })
}
