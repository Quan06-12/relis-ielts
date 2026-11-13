import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadMembership, requireTeacher } from '../middleware/classMembership.js'
import {
  createClass,
  listMyClasses,
  joinClass,
  getClass,
  listMembers,
  listClassLibrary,
  addToClassLibrary,
  removeFromClassLibrary,
  getGradebook,
} from '../controllers/classes.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listMyClasses)
router.post('/', createClass)
router.post('/join', joinClass)

// Every route below is about one class: members only, some teachers only
router.get('/:classId', loadMembership, getClass)
router.get('/:classId/members', loadMembership, requireTeacher, listMembers)
router.get('/:classId/library', loadMembership, listClassLibrary)
router.post('/:classId/library', loadMembership, requireTeacher, addToClassLibrary)
router.delete('/:classId/library/:testId', loadMembership, requireTeacher, removeFromClassLibrary)
router.get('/:classId/gradebook', loadMembership, requireTeacher, getGradebook)

export default router
