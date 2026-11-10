// An error we expect and can explain to the client, e.g. "test not found".
// Throw it anywhere; the error handler turns it into { error: { code, message, details } }.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// Shortcuts for the errors we throw most often
export const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`)

export const validationError = (details) => new AppError(400, 'VALIDATION_ERROR', 'Invalid request data', details)
