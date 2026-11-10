import { OAuth2Client } from 'google-auth-library'
import { AppError } from '../errors/AppError.js'

// Returns a function that checks a Google ID token and gives back the person's profile.
// Kept as a separate service so tests can replace it with a fake one (no call to Google).
export function createGoogleVerifier(clientId) {
  const client = new OAuth2Client(clientId)

  return async function verifyGoogleCredential(credential) {
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId })
      const profile = ticket.getPayload()
      return {
        googleId: profile.sub,
        email: profile.email,
        name: profile.name ?? profile.email,
        avatarUrl: profile.picture ?? null,
      }
    } catch {
      throw new AppError(401, 'INVALID_GOOGLE_TOKEN', 'Google could not verify this credential')
    }
  }
}
