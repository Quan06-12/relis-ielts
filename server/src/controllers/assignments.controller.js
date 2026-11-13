import mongoose from 'mongoose'
import { Assignment } from '../models/Assignment.js'
import { ClassMember } from '../models/ClassMember.js'
import { ClassLibraryItem } from '../models/ClassLibraryItem.js'
import { Test } from '../models/Test.js'
import { Attempt } from '../models/Attempt.js'
import { notFound, validationError } from '../errors/AppError.js'
import { assignmentStatus } from '../utils/assignmentStatus.js'

// POST /api/classes/:classId/assignments — teacher gives one of their published tests as homework (US44)
// The test is also put in the class library, so students are allowed to open it.
export async function createAssignment(request, response) {
  const { classId } = request.params
  const { testId, deadline, allowLate = false } = request.body ?? {}

  const problems = []
  if (!mongoose.isValidObjectId(testId)) problems.push({ field: 'testId', message: 'testId is required' })
  if (Number.isNaN(Date.parse(deadline))) problems.push({ field: 'deadline', message: 'deadline must be a date' })
  else if (new Date(deadline) <= new Date()) problems.push({ field: 'deadline', message: 'deadline must be in the future' })
  if (typeof allowLate !== 'boolean') problems.push({ field: 'allowLate', message: 'allowLate must be true or false' })
  if (problems.length > 0) throw validationError(problems)

  const test = await Test.findOne({ _id: testId, ownerId: request.userId, status: 'published', hidden: false })
  if (!test) throw validationError([{ field: 'testId', message: 'only your own published tests can be assigned' }])

  await ClassLibraryItem.updateOne(
    { classId, testId: test._id },
    { $setOnInsert: { addedBy: request.userId, addedAt: new Date() } },
    { upsert: true }
  )
  const assignment = await Assignment.create({ classId, testId: test._id, assignedBy: request.userId, deadline, allowLate })

  response.status(201).json({ assignment: toAssignmentView(assignment, test) })
}

// GET /api/classes/:classId/assignments — every member (US44, US45)
// Teachers see how many students handed in; students see their own status and score.
export async function listAssignments(request, response) {
  const { classId } = request.params
  const assignments = await Assignment.find({ classId }).sort({ deadline: 1 })
  const tests = await Test.find({ _id: { $in: assignments.map((item) => item.testId) } }).select('title skill durationMin questionCount')
  const testById = new Map(tests.map((test) => [String(test._id), test]))
  const assignmentIds = assignments.map((item) => item._id)

  if (request.classRole === 'teacher') {
    const [studentCount, handedIn] = await Promise.all([
      ClassMember.countDocuments({ classId, role: 'student' }),
      // number of different students who submitted each assignment
      Attempt.aggregate([
        { $match: { assignmentId: { $in: assignmentIds }, status: 'submitted' } },
        { $group: { _id: { assignmentId: '$assignmentId', userId: '$userId' } } },
        { $group: { _id: '$_id.assignmentId', count: { $sum: 1 } } },
      ]),
    ])
    const countById = new Map(handedIn.map((row) => [String(row._id), row.count]))

    const items = assignments.map((assignment) => ({
      ...toAssignmentView(assignment, testById.get(String(assignment.testId))),
      submittedCount: countById.get(String(assignment._id)) ?? 0,
      studentCount,
    }))
    return response.json({ items })
  }

  // Student: their latest attempt for each assignment
  const myAttempts = await Attempt.find({ userId: request.userId, assignmentId: { $in: assignmentIds } }).sort({ startedAt: -1 })
  const latestByAssignment = new Map()
  for (const attempt of myAttempts) {
    const id = String(attempt.assignmentId)
    if (!latestByAssignment.has(id)) latestByAssignment.set(id, attempt)
  }

  const items = assignments.map((assignment) => {
    const attempt = latestByAssignment.get(String(assignment._id)) ?? null
    return {
      ...toAssignmentView(assignment, testById.get(String(assignment.testId))),
      myStatus: assignmentStatus(assignment, attempt),
      myAttemptId: attempt ? attempt.id : null,
      myResult: attempt?.result ?? null,
    }
  })
  response.json({ items })
}

// DELETE /api/classes/:classId/assignments/:assignmentId — teacher only; attempts already made are kept
export async function deleteAssignment(request, response) {
  const { classId, assignmentId } = request.params
  if (!mongoose.isValidObjectId(assignmentId)) throw notFound('Assignment')

  const result = await Assignment.deleteOne({ _id: assignmentId, classId })
  if (result.deletedCount === 0) throw notFound('Assignment')

  response.status(204).end()
}

function toAssignmentView(assignment, test) {
  return {
    id: assignment.id,
    classId: String(assignment.classId),
    deadline: assignment.deadline,
    allowLate: assignment.allowLate,
    createdAt: assignment.createdAt,
    test: test
      ? { id: String(test._id), title: test.title, skill: test.skill, durationMin: test.durationMin, questionCount: test.questionCount }
      : null,
  }
}
