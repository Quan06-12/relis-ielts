import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  startAttempt,
  getAttempt,
  saveAnswers,
  submitAttempt,
  reviewAttempt,
  listMyAttempts,
} from '../controllers/attempts.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listMyAttempts)
router.post('/', startAttempt)
router.get('/:attemptId', getAttempt)
router.patch('/:attemptId/answers', saveAnswers)
router.post('/:attemptId/submit', submitAttempt)
router.get('/:attemptId/review', reviewAttempt)

export default router
