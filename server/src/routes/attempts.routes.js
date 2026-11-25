import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  startAttempt,
  getAttempt,
  saveAnswers,
  submitAttempt,
  deleteAttempt,
  reviewAttempt,
  listMyAttempts,
  getActivity,
  getStudyTime,
} from '../controllers/attempts.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listMyAttempts)
// Before '/:attemptId', otherwise "activity" and "study-time" would be read as attempt ids
router.get('/activity', getActivity)
router.get('/study-time', getStudyTime)
router.post('/', startAttempt)
router.get('/:attemptId', getAttempt)
router.patch('/:attemptId/answers', saveAnswers)
router.post('/:attemptId/submit', submitAttempt)
router.get('/:attemptId/review', reviewAttempt)
router.delete('/:attemptId', deleteAttempt)

export default router
