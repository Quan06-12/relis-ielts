import { Assignment } from '../models/Assignment.js'
import { Attempt } from '../models/Attempt.js'
import { Test } from '../models/Test.js'
import { teacherCardStats, studentCardStats } from '../utils/classCardStats.js'

// Loads what the class cards need for one user: classId → extra fields for the card.
// memberships: the user's ClassMember documents (role per class)
export async function loadClassCardStats(memberships, userId) {
  const classIds = memberships.map((membership) => membership.classId)
  const [assignments, classAttempts] = await Promise.all([
    Assignment.find({ classId: { $in: classIds } }).select('classId testId deadline'),
    Attempt.find({ classId: { $in: classIds }, status: 'submitted' }).select('classId userId assignmentId submittedAt'),
  ])
  const tests = await Test.find({ _id: { $in: assignments.map((item) => item.testId) } }).select('title')
  const titleById = new Map(tests.map((test) => [String(test._id), test.title]))

  const stats = new Map()
  for (const membership of memberships) {
    const id = String(membership.classId)
    const classAssignments = assignments.filter((item) => String(item.classId) === id)

    if (membership.role === 'teacher') {
      const studentAttempts = classAttempts.filter((attempt) => String(attempt.classId) === id && String(attempt.userId) !== String(userId))
      stats.set(id, teacherCardStats(classAssignments, studentAttempts))
    } else {
      const submittedIds = new Set(
        classAttempts
          .filter((attempt) => String(attempt.userId) === String(userId) && attempt.assignmentId)
          .map((attempt) => String(attempt.assignmentId))
      )
      const forCard = classAssignments.map((item) => ({ id: String(item._id), deadline: item.deadline, testTitle: titleById.get(String(item.testId)) ?? '' }))
      stats.set(id, studentCardStats(forCard, submittedIds))
    }
  }
  return stats
}
