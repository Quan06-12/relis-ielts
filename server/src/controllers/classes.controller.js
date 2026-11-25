import mongoose from 'mongoose'
import { Class, CLASS_COLORS } from '../models/Class.js'
import { ClassMember } from '../models/ClassMember.js'
import { ClassLibraryItem } from '../models/ClassLibraryItem.js'
import { Test } from '../models/Test.js'
import { Attempt } from '../models/Attempt.js'
import { AppError, notFound, validationError } from '../errors/AppError.js'
import { generateClassCode, normalizeClassCode } from '../utils/classCode.js'
import { buildGradebook } from '../utils/gradebook.js'
import { loadClassCardStats } from '../services/classStats.js'
import { toSummary } from '../utils/testContent.js'
import { findLastBands } from '../services/attemptStats.js'

const DUPLICATE_KEY = 11000 // MongoDB error code when a unique index is violated
const MAX_CODE_TRIES = 5

// POST /api/classes — create a class; the creator becomes its teacher (US04)
export async function createClass(request, response) {
  const { name, description = '', color = 'purple' } = request.body ?? {}

  const problems = []
  if (typeof name !== 'string' || name.trim() === '') problems.push({ field: 'name', message: 'name is required' })
  if (typeof description !== 'string') problems.push({ field: 'description', message: 'description must be text' })
  if (!CLASS_COLORS.includes(color)) problems.push({ field: 'color', message: `color must be one of ${CLASS_COLORS.join(', ')}` })
  if (problems.length > 0) throw validationError(problems)

  const newClass = await createWithUniqueCode({ name, description, color, createdBy: request.userId })
  await ClassMember.create({ classId: newClass._id, userId: request.userId, role: 'teacher' })

  response.status(201).json({ class: toClassView(newClass, 'teacher', { studentCount: 0 }) })
}

// GET /api/classes?role=teacher|student — the classes I teach and the classes I study in (US07),
// with the numbers shown on each card (open assignments, recent submissions / my progress, next deadline)
export async function listMyClasses(request, response) {
  const filter = { userId: request.userId }
  if (['teacher', 'student'].includes(request.query.role)) filter.role = request.query.role

  const memberships = await ClassMember.find(filter).sort({ joinedAt: -1 })
  const classIds = memberships.map((membership) => membership.classId)

  const [classes, studentCounts, teachers, cardStats] = await Promise.all([
    Class.find({ _id: { $in: classIds } }),
    countStudents(classIds),
    findTeacherNames(classIds),
    loadClassCardStats(memberships, request.userId),
  ])
  const classById = new Map(classes.map((item) => [String(item._id), item]))

  const items = memberships
    .filter((membership) => classById.has(String(membership.classId)))
    .map((membership) => {
      const id = String(membership.classId)
      return toClassView(classById.get(id), membership.role, {
        studentCount: studentCounts.get(id) ?? 0,
        teacherName: teachers.get(id) ?? null,
        ...cardStats.get(id),
      })
    })

  response.json({ items })
}

// POST /api/classes/join — a student types the class code (US06)
export async function joinClass(request, response) {
  const code = normalizeClassCode(request.body?.code)
  if (code === '') throw validationError([{ field: 'code', message: 'code is required' }])

  const foundClass = await Class.findOne({ code })
  if (!foundClass) throw notFound('Class')

  const alreadyMember = () => new AppError(409, 'ALREADY_MEMBER', 'You are already in this class', { classId: foundClass.id })

  if (await ClassMember.exists({ classId: foundClass._id, userId: request.userId })) {
    throw alreadyMember()
  }

  try {
    await ClassMember.create({ classId: foundClass._id, userId: request.userId, role: 'student' })
  } catch (error) {
    // Two join requests at the same moment: the unique index (classId, userId) stops the second one
    if (error.code === DUPLICATE_KEY) throw alreadyMember()
    throw error
  }

  response.status(201).json({ class: toClassView(foundClass, 'student') })
}

// GET /api/classes/:classId — class details; only teachers see the code (US05)
export async function getClass(request, response) {
  const foundClass = await Class.findById(request.params.classId)
  const studentCounts = await countStudents([foundClass._id])
  response.json({ class: toClassView(foundClass, request.classRole, { studentCount: studentCounts.get(foundClass.id) ?? 0 }) })
}

// GET /api/classes/:classId/members — teacher only
export async function listMembers(request, response) {
  const memberships = await ClassMember.find({ classId: request.params.classId })
    .sort({ role: -1, joinedAt: 1 }) // teachers first, then students in the order they joined
    .populate('userId', 'name email username avatarUrl')

  const items = memberships.map((membership) => ({
    user: toPublicUser(membership.userId),
    role: membership.role,
    joinedAt: membership.joinedAt,
  }))
  response.json({ items })
}

// DELETE /api/classes/:classId/members/:userId — teacher removes a student (US09)
// Their attempts stay in the database, so their own history is not lost.
export async function removeStudent(request, response) {
  const { classId, userId } = request.params
  if (!mongoose.isValidObjectId(userId)) throw notFound('Member')

  const result = await ClassMember.deleteOne({ classId, userId, role: 'student' })
  if (result.deletedCount === 0) throw notFound('Member')

  response.status(204).end()
}

// DELETE /api/classes/:classId/membership — a student leaves the class (US10)
// To come back they need the class code again. Submitted attempts stay in their history.
export async function leaveClass(request, response) {
  if (request.classRole === 'teacher') {
    throw new AppError(409, 'TEACHER_CANNOT_LEAVE', 'The teacher of a class cannot leave it')
  }

  await ClassMember.deleteOne({ classId: request.params.classId, userId: request.userId })
  response.status(204).end()
}

// GET /api/classes/:classId/library — tests in the class library, for every member (US22)
export async function listClassLibrary(request, response) {
  const items = await ClassLibraryItem.find({ classId: request.params.classId }).sort({ addedAt: -1 })
  const tests = await Test.find({ _id: { $in: items.map((item) => item.testId) }, hidden: false })
  const testById = new Map(tests.map((test) => [String(test._id), test]))
  const lastBands = await findLastBands(request.userId, tests.map((test) => test._id))

  const result = items
    .filter((item) => testById.has(String(item.testId)))
    .map((item) => {
      const id = String(item.testId)
      return { ...toSummary(testById.get(id), lastBands.get(id) ?? null), addedAt: item.addedAt }
    })

  response.json({ items: result })
}

// POST /api/classes/:classId/library — teacher adds some of their published tests (US21)
// Tests already in the class are skipped, so sending the same list twice is harmless.
export async function addToClassLibrary(request, response) {
  const testIds = request.body?.testIds
  if (!Array.isArray(testIds) || testIds.length === 0 || !testIds.every((id) => mongoose.isValidObjectId(id))) {
    throw validationError([{ field: 'testIds', message: 'testIds must be a non-empty list of test ids' }])
  }

  // Only the teacher's own published tests can go into a class
  const tests = await Test.find({ _id: { $in: testIds }, ownerId: request.userId, status: 'published', hidden: false })
  const foundIds = new Set(tests.map((test) => String(test._id)))
  const rejected = testIds.filter((id) => !foundIds.has(String(id)))
  if (rejected.length > 0) {
    throw validationError(rejected.map((id) => ({ field: 'testIds', message: `test ${id} is not one of your published tests` })))
  }

  // upsert = insert only when (classId, testId) is not there yet
  const result = await ClassLibraryItem.bulkWrite(
    tests.map((test) => ({
      updateOne: {
        filter: { classId: request.params.classId, testId: test._id },
        update: { $setOnInsert: { addedBy: request.userId, addedAt: new Date() } },
        upsert: true,
      },
    }))
  )

  response.json({ added: result.upsertedCount })
}

// DELETE /api/classes/:classId/library/:testId — teacher removes a test; attempts already made are kept (US21)
export async function removeFromClassLibrary(request, response) {
  const { classId, testId } = request.params
  if (!mongoose.isValidObjectId(testId)) throw notFound('Test')

  const result = await ClassLibraryItem.deleteOne({ classId, testId })
  if (result.deletedCount === 0) throw notFound('Test')

  response.status(204).end()
}

// GET /api/classes/:classId/gradebook — students × class tests, teacher only (US40)
export async function getGradebook(request, response) {
  const { classId } = request.params

  const [studentMemberships, libraryItems] = await Promise.all([
    ClassMember.find({ classId, role: 'student' }).sort({ joinedAt: 1 }).populate('userId', 'name email username avatarUrl'),
    ClassLibraryItem.find({ classId }).sort({ addedAt: 1 }),
  ])
  const tests = await Test.find({ _id: { $in: libraryItems.map((item) => item.testId) } })
  const testById = new Map(tests.map((test) => [String(test._id), test]))

  const attempts = await Attempt.find({ classId, status: 'submitted', testId: { $in: tests.map((test) => test._id) } })

  const gradebook = buildGradebook(
    studentMemberships.map((membership) => toPublicUser(membership.userId)),
    libraryItems
      .filter((item) => testById.has(String(item.testId)))
      .map((item) => {
        const test = testById.get(String(item.testId))
        return { id: String(test._id), title: test.title, skill: test.skill }
      }),
    attempts.map((attempt) => ({
      id: attempt.id,
      userId: String(attempt.userId),
      testId: String(attempt.testId),
      result: attempt.result,
      submittedAt: attempt.submittedAt,
    }))
  )

  response.json(gradebook)
}

// ---- helpers ----

// The code is random, so it can (rarely) collide with an existing one: then try a new code.
async function createWithUniqueCode(fields) {
  for (let attempt = 1; attempt <= MAX_CODE_TRIES; attempt += 1) {
    try {
      return await Class.create({ ...fields, code: generateClassCode() })
    } catch (error) {
      const isCodeTaken = error.code === DUPLICATE_KEY && error.keyPattern?.code
      if (!isCodeTaken || attempt === MAX_CODE_TRIES) throw error
    }
  }
}

// classId → number of students
async function countStudents(classIds) {
  const rows = await ClassMember.aggregate([
    { $match: { classId: { $in: classIds.map((id) => new mongoose.Types.ObjectId(String(id))) }, role: 'student' } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
  ])
  return new Map(rows.map((row) => [String(row._id), row.count]))
}

// classId → name of the teacher who created it, shown on the cards of classes I study in
async function findTeacherNames(classIds) {
  const teachers = await ClassMember.find({ classId: { $in: classIds }, role: 'teacher' }).populate('userId', 'name')
  const names = new Map()
  for (const teacher of teachers) {
    const id = String(teacher.classId)
    if (!names.has(id) && teacher.userId) names.set(id, teacher.userId.name)
  }
  return names
}

function toClassView(item, myRole, extra = {}) {
  return {
    id: String(item._id),
    name: item.name,
    description: item.description,
    color: item.color,
    // Only teachers get the code: a student could otherwise pass it around
    code: myRole === 'teacher' ? item.code : null,
    myRole,
    createdAt: item.createdAt,
    ...extra,
  }
}

function toPublicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email ?? null, username: user.username ?? null, avatarUrl: user.avatarUrl ?? null }
}
