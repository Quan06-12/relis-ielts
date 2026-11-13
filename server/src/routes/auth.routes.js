import { Router } from 'express'
import { signInWithGoogle, getCurrentUser } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

export function createAuthRoutes({ verifyGoogleCredential }) {
  const router = Router()

  router.post('/google', signInWithGoogle(verifyGoogleCredential))
  router.get('/me', requireAuth, getCurrentUser)

  return router
}
