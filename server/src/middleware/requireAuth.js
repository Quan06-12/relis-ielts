import { AppError } from '../errors/AppError.js'
import { readUserIdFromHeader } from '../utils/token.js'
import { User } from '../models/User.js'
import { isAdminUser } from '../utils/admin.js'

// Put in front of every route that needs a signed-in user.
// Reads "Authorization: Bearer <token>" and stores the user id in request.userId.
export function requireAuth(request, response, next) {
  const userId = readUserIdFromHeader(request.get('Authorization'))

  if (!userId) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in required')
  }

  request.userId = userId
  next()
}

// Put after requireAuth on routes guests may not use (creating or joining a class)
export async function refuseGuests(request, response, next) {
  if (await User.exists({ _id: request.userId, isGuest: true })) {
    throw new AppError(403, 'GUEST_NOT_ALLOWED', 'Sign in with Google to create or join a class')
  }
  next()
}

// Put after requireAuth on admin routes (system tests, statistics)
export async function requireAdmin(request, response, next) {
  const user = await User.findById(request.userId)
  if (!isAdminUser(user)) {
    throw new AppError(403, 'ADMIN_ONLY', 'Only an admin can do this')
  }
  next()
}
