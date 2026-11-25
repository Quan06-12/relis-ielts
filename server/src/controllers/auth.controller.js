import { User } from '../models/User.js'
import { createToken, readUserIdFromHeader } from '../utils/token.js'
import { AppError, notFound, validationError } from '../errors/AppError.js'

// POST /api/auth/google (US01)
// `verifyGoogleCredential` is passed in, so tests can use a fake instead of calling Google.
export function signInWithGoogle(verifyGoogleCredential) {
  return async (request, response) => {
    const { credential } = request.body ?? {}
    if (typeof credential !== 'string' || credential === '') {
      throw validationError([{ field: 'credential', message: 'credential is required' }])
    }

    const profile = await verifyGoogleCredential(credential)

    // A guest who signs in with Google for the first time becomes that Google account,
    // so the tests and attempts made as a guest are kept
    const guestId = readUserIdFromHeader(request.get('Authorization'))
    if (guestId && !(await User.exists({ googleId: profile.googleId }))) {
      const upgraded = await User.findOneAndUpdate(
        { _id: guestId, isGuest: true },
        { $set: { googleId: profile.googleId, email: profile.email, name: profile.name, avatarUrl: profile.avatarUrl, isGuest: false } },
        { new: true, runValidators: true }
      )
      if (upgraded) {
        response.json({ token: createToken(upgraded.id), user: upgraded })
        return
      }
    }

    // First sign-in creates the account; later sign-ins refresh name and picture
    const user = await User.findOneAndUpdate(
      { googleId: profile.googleId },
      { $set: { email: profile.email, name: profile.name, avatarUrl: profile.avatarUrl } },
      { upsert: true, new: true, runValidators: true }
    )

    response.json({ token: createToken(user.id), user })
  }
}

// GET /api/auth/me (US02)
export async function getCurrentUser(request, response) {
  const user = await User.findById(request.userId)
  if (!user) {
    throw notFound('User')
  }
  response.json({ user })
}

// POST /api/auth/guest — try Relis without an account.
// Creates a guest user and returns its token; the browser keeps the token like any other.
export function signInAsGuest(limiter) {
  return async (request, response) => {
    if (!limiter.allow(request.ip)) {
      throw new AppError(429, 'TOO_MANY_GUESTS', 'Too many guest accounts from this address, try again later')
    }
    const user = await User.create({ name: 'Khách', isGuest: true })
    response.status(201).json({ token: createToken(user.id), user })
  }
}
