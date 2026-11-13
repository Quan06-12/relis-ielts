import { User } from '../models/User.js'
import { createToken } from '../utils/token.js'
import { notFound, validationError } from '../errors/AppError.js'

// POST /api/auth/google (US01)
// `verifyGoogleCredential` is passed in, so tests can use a fake instead of calling Google.
export function signInWithGoogle(verifyGoogleCredential) {
  return async (request, response) => {
    const { credential } = request.body ?? {}
    if (typeof credential !== 'string' || credential === '') {
      throw validationError([{ field: 'credential', message: 'credential is required' }])
    }

    const profile = await verifyGoogleCredential(credential)

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
