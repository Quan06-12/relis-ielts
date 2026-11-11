import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { startAttempt, getAttempt, saveAnswers, submitAttempt } from '../controllers/attempts.controller.js'

const router = Router()

router.use(requireAuth)

router.post('/', startAttempt)
router.get('/:attemptId', getAttempt)
router.patch('/:attemptId/answers', saveAnswers)
router.post('/:attemptId/submit', submitAttempt)

export default router
