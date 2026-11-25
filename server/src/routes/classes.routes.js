import { Router } from 'express'
import { requireAuth, refuseGuests } from '../middleware/requireAuth.js'
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
  removeStudent,
  leaveClass,
} from '../controllers/classes.controller.js'
import { createAssignment, listAssignments, deleteAssignment } from '../controllers/assignments.controller.js'
import { getLeaderboard } from '../controllers/leaderboard.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listMyClasses)
// Guests use everything else, but classes need a real account
router.post('/', refuseGuests, createClass)
router.post('/join', refuseGuests, joinClass)

// Every route below is about one class: members only, some teachers only
router.get('/:classId', loadMembership, getClass)
router.get('/:classId/members', loadMembership, requireTeacher, listMembers)
router.delete('/:classId/members/:userId', loadMembership, requireTeacher, removeStudent)
router.delete('/:classId/membership', loadMembership, leaveClass)
router.get('/:classId/library', loadMembership, listClassLibrary)
router.post('/:classId/library', loadMembership, requireTeacher, addToClassLibrary)
router.delete('/:classId/library/:testId', loadMembership, requireTeacher, removeFromClassLibrary)
router.get('/:classId/gradebook', loadMembership, requireTeacher, getGradebook)
router.get('/:classId/assignments', loadMembership, listAssignments)
router.get('/:classId/leaderboard', loadMembership, getLeaderboard)
router.post('/:classId/assignments', loadMembership, requireTeacher, createAssignment)
router.delete('/:classId/assignments/:assignmentId', loadMembership, requireTeacher, deleteAssignment)

export default router
