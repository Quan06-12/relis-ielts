import { User } from '../models/User.js'
import { createToken } from '../utils/token.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { AppError, notFound, validationError } from '../errors/AppError.js'

// 3–30 characters: lower-case letters, digits, dot and underscore (stored in lower case)
const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72

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

// POST /api/auth/register — create an account with a username and password of the user's choice.
// The display name is optional; without it the username is shown.
export async function register(request, response) {
  const { username, password, name } = request.body ?? {}
  const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
  const cleanName = typeof name === 'string' && name.trim() !== '' ? name.trim() : cleanUsername

  const problems = []
  if (!USERNAME_PATTERN.test(cleanUsername)) {
    problems.push({ field: 'username', message: 'username must be 3 to 30 characters: letters, digits, dot or underscore' })
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    problems.push({ field: 'password', message: `password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters` })
  }
  if (cleanName.length > 60) problems.push({ field: 'name', message: 'name must be at most 60 characters' })
  if (problems.length > 0) throw validationError(problems)

  if (await User.exists({ username: cleanUsername })) {
    throw new AppError(409, 'USERNAME_TAKEN', 'This username is already taken')
  }

  let user
  try {
    user = await User.create({ username: cleanUsername, name: cleanName, passwordHash: await hashPassword(password) })
  } catch (error) {
    // Two sign-ups with the same username at the same moment: the unique index stops the second one
    if (error.code === 11000) throw new AppError(409, 'USERNAME_TAKEN', 'This username is already taken')
    throw error
  }
  response.status(201).json({ token: createToken(user.id), user })
}

// POST /api/auth/login — sign in with username and password.
// An unknown username and a wrong password get the same answer, so the API does not reveal who has an account.
export function signInWithPassword(limiter) {
  return async (request, response) => {
    const { username, password } = request.body ?? {}
    if (typeof username !== 'string' || typeof password !== 'string' || username.trim() === '' || password === '') {
      throw validationError([{ field: 'username', message: 'username and password are required' }])
    }
    const cleanUsername = username.trim().toLowerCase()

    const waitSec = limiter.retryAfterSec(cleanUsername)
    if (waitSec > 0) {
      response.set('Retry-After', String(waitSec))
      throw new AppError(429, 'TOO_MANY_ATTEMPTS', 'Too many wrong passwords, try again later')
    }

    const user = await User.findOne({ username: cleanUsername }).select('+passwordHash')
    const isValid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false
    if (!isValid) {
      limiter.recordFailure(cleanUsername)
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Username or password is wrong')
    }

    limiter.reset(cleanUsername)
    response.json({ token: createToken(user.id), user })
  }
}
