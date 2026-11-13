import { AppError } from '../errors/AppError.js'

// Runs when no route matched the URL.
export function notFoundRoute(request, response, next) {
  next(new AppError(404, 'NOT_FOUND', `No route for ${request.method} ${request.path}`))
}
