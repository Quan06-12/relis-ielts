import { Router } from 'express'
import { signInWithGoogle, getCurrentUser, signInAsGuest } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { createRateLimit } from '../utils/rateLimit.js'

// At most 10 guest accounts per IP address per hour, so a script cannot fill the database
const GUEST_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 }

export function createAuthRoutes({ verifyGoogleCredential, guestLimiter = createRateLimit(GUEST_LIMIT) }) {
  const router = Router()

  router.post('/google', signInWithGoogle(verifyGoogleCredential))
  router.post('/guest', signInAsGuest(guestLimiter))
  router.get('/me', requireAuth, getCurrentUser)

  return router
}
