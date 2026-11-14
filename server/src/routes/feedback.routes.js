import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { createFeedbackController } from '../controllers/feedback.controller.js'

// Separate from attempts.routes.js because it needs the Gemini service, which tests replace with a fake
export function createFeedbackRoutes({ generateFeedback }) {
  const router = Router()
  router.post('/:attemptId/feedback', requireAuth, createFeedbackController(generateFeedback))
  return router
}
