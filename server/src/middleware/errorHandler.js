import mongoose from 'mongoose'
import { AppError } from '../errors/AppError.js'

// Last middleware in the app. Every error ends up here and leaves in the same shape,
// so the client only needs to read `error.code` (see the error table in docs/api/README.md).
// The four parameters are required: that is how Express recognises an error handler (`_next` is unused).
export function errorHandler(error, request, response, _next) {
  const { status, body } = toErrorResponse(error)

  if (status === 500) {
    console.error(error)
  }

  response.status(status).json(body)
}

// Kept separate from Express so it can be unit tested on its own.
export function toErrorResponse(error) {
  if (error instanceof AppError) {
    return reply(error.status, error.code, error.message, error.details)
  }

  // Body is not valid JSON (thrown by express.json())
  if (error.type === 'entity.parse.failed') {
    return reply(400, 'INVALID_JSON', 'Request body is not valid JSON')
  }

  // A schema rule failed, e.g. a required field is missing
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }))
    return reply(400, 'VALIDATION_ERROR', 'Invalid request data', details)
  }

  // An id in the URL is not a valid ObjectId: for the client it simply does not exist
  if (error instanceof mongoose.Error.CastError) {
    return reply(404, 'NOT_FOUND', 'Resource not found')
  }

  // The database is not reachable
  if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
    return reply(503, 'DATABASE_UNAVAILABLE', 'Database is not reachable')
  }

  return reply(500, 'INTERNAL_ERROR', 'Something went wrong on the server')
}

function reply(status, code, message, details) {
  const error = { code, message }
  if (details !== undefined) {
    error.details = details
  }
  return { status, body: { error } }
}
