import { User } from '../models/User.js'
import { createToken } from '../utils/token.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { AppError, notFound, validationError } from '../errors/AppError.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

    // An account made with email and password is linked the first time its owner uses Google:
    // Google has checked that the email belongs to them.
    const linked = await User.findOneAndUpdate(
      { email: profile.email.toLowerCase(), googleId: { $exists: false } },
      { $set: { googleId: profile.googleId, avatarUrl: profile.avatarUrl } },
      { new: true }
    )

    // First sign-in creates the account; later sign-ins refresh name and picture
    const user = linked ?? await User.findOneAndUpdate(
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

// POST /api/auth/register — create an account with name, email and password
export async function register(request, response) {
  const { name, email, password } = request.body ?? {}
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const cleanName = typeof name === 'string' ? name.trim() : ''

  const problems = []
  if (cleanName === '' || cleanName.length > 60) problems.push({ field: 'name', message: 'name must be 1 to 60 characters' })
  if (!EMAIL_PATTERN.test(cleanEmail)) problems.push({ field: 'email', message: 'email is not valid' })
  if (typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    problems.push({ field: 'password', message: `password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters` })
  }
  if (problems.length > 0) throw validationError(problems)

  if (await User.exists({ email: cleanEmail })) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists')
  }

  let user
  try {
    user = await User.create({ name: cleanName, email: cleanEmail, passwordHash: await hashPassword(password) })
  } catch (error) {
    // Two sign-ups with the same email at the same moment: the unique index stops the second one
    if (error.code === 11000) throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists')
    throw error
  }
  response.status(201).json({ token: createToken(user.id), user })
}

// POST /api/auth/login — sign in with email and password.
// Unknown email and wrong password get the same answer, so the API does not reveal who has an account.
export function signInWithPassword(limiter) {
  return async (request, response) => {
    const { email, password } = request.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || email.trim() === '' || password === '') {
      throw validationError([{ field: 'email', message: 'email and password are required' }])
    }
    const cleanEmail = email.trim().toLowerCase()

    const waitSec = limiter.retryAfterSec(cleanEmail)
    if (waitSec > 0) {
      response.set('Retry-After', String(waitSec))
      throw new AppError(429, 'TOO_MANY_ATTEMPTS', 'Too many wrong passwords, try again later')
    }

    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash')
    const isValid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false
    if (!isValid) {
      limiter.recordFailure(cleanEmail)
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is wrong')
    }

    limiter.reset(cleanEmail)
    response.json({ token: createToken(user.id), user })
  }
}
