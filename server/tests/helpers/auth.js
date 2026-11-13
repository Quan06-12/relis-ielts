import { createToken } from '../../src/utils/token.js'
import { User } from '../../src/models/User.js'

process.env.JWT_SECRET ??= 'test-secret'

// Fake Google check for tests: the credential "google:<name>" becomes a user called <name>.
export async function fakeVerifyGoogleCredential(credential) {
  if (!credential.startsWith('google:')) {
    const { AppError } = await import('../../src/errors/AppError.js')
    throw new AppError(401, 'INVALID_GOOGLE_TOKEN', 'Google could not verify this credential')
  }
  const name = credential.slice('google:'.length)
  return { googleId: `id-${name}`, email: `${name}@gmail.com`, name, avatarUrl: null }
}

// Creates a user directly in the database and returns it with a valid "Authorization" header.
export async function createSignedInUser(name = 'alice') {
  const user = await User.create({ googleId: `id-${name}`, email: `${name}@gmail.com`, name })
  return { user, authHeader: `Bearer ${createToken(user.id)}` }
}
