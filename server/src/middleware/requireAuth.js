import { AppError } from '../errors/AppError.js'
import { readUserIdFromToken } from '../utils/token.js'

// Put in front of every route that needs a signed-in user.
// Reads "Authorization: Bearer <token>" and stores the user id in request.userId.
export function requireAuth(request, response, next) {
  const header = request.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  const userId = token ? readUserIdFromToken(token) : null

  if (!userId) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in required')
  }

  request.userId = userId
  next()
}
