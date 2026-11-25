import { Router } from 'express'
import { signInWithGoogle, getCurrentUser, register, signInWithPassword } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { createLoginLimiter } from '../utils/loginLimiter.js'

export function createAuthRoutes({ verifyGoogleCredential, loginLimiter = createLoginLimiter() }) {
  const router = Router()

  router.post('/google', signInWithGoogle(verifyGoogleCredential))
  router.post('/register', register)
  router.post('/login', signInWithPassword(loginLimiter))
  router.get('/me', requireAuth, getCurrentUser)

  return router
}
