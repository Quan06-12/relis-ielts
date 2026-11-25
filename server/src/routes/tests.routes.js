import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  listMyTests,
  createTest,
  getTest,
  saveTest,
  changeTestStatus,
  deleteTest,
  getTestForPlay,
  listClassesWithTest,
} from '../controllers/tests.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listMyTests)
router.post('/', createTest)
router.get('/:testId', getTest)
router.put('/:testId', saveTest)
router.patch('/:testId/status', changeTestStatus)
router.delete('/:testId', deleteTest)
router.get('/:testId/play', getTestForPlay)
router.get('/:testId/classes', listClassesWithTest)

export default router
