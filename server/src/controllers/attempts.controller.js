import mongoose from 'mongoose'
import { Attempt } from '../models/Attempt.js'
import { Test } from '../models/Test.js'
import { AppError, notFound, validationError } from '../errors/AppError.js'
import { findTestUserCanTake } from '../services/testAccess.js'
import { canTakeFromClass, isTeacherOf, findRole } from '../services/classAccess.js'
import { Assignment } from '../models/Assignment.js'
import { canStartAssignment } from '../utils/assignmentStatus.js'
import { Class } from '../models/Class.js'
import { checkMode } from '../utils/attemptMode.js'
import { secondsLeft, isPastDeadline } from '../utils/attemptTimer.js'
import { listQuestions, toPlayView, toReviewView } from '../utils/testContent.js'
import { gradeAttempt } from '../utils/grading.js'
import { activityByDay, currentStreak, dayKey, safeTimeZone } from '../utils/activity.js'

// POST /api/attempts — start taking a test (US24, US25), alone, from a class library (US22)
// or as a class assignment (US44)
export async function startAttempt(request, response) {
  const { testId, mode, assignmentId = null } = request.body ?? {}
  let { classId = null } = request.body ?? {}
  if (!mongoose.isValidObjectId(testId)) {
    throw validationError([{ field: 'testId', message: 'testId is required' }])
  }
  if (classId !== null && !mongoose.isValidObjectId(classId)) {
    throw validationError([{ field: 'classId', message: 'classId must be a class id or null' }])
  }
  if (assignmentId !== null && !mongoose.isValidObjectId(assignmentId)) {
    throw validationError([{ field: 'assignmentId', message: 'assignmentId must be an assignment id or null' }])
  }

  let assignment = null
  if (assignmentId !== null) {
    // Homework: the assignment must be for this test and for a class the user is in
    assignment = await Assignment.findOne({ _id: assignmentId, testId })
    if (!assignment || !(await findRole(assignment.classId, request.userId))) {
      throw notFound('Assignment')
    }
    if (!canStartAssignment(assignment)) {
      throw new AppError(422, 'DEADLINE_PASSED', 'The deadline of this assignment has passed')
    }
    classId = assignment.classId
  }

  const test = assignment
    ? await Test.findOne({ _id: testId, status: 'published', hidden: false })
    : await findTestUserCanTake(testId, request.userId)
  if (!test) throw notFound('Test')
  const cleanMode = checkMode(mode, test)

  if (assignmentId === null && classId !== null && !(await canTakeFromClass(classId, test._id, request.userId))) {
    // Started from a class library: remember the class so the teacher's gradebook can find it (US40)
    throw notFound('Test')
  }

  // Only one unfinished attempt per test: offer to continue it instead (US33)
  const unfinished = await Attempt.findOne({ userId: request.userId, testId: test._id, status: 'in_progress' })
  if (unfinished && !isPastDeadline(unfinished)) {
    throw new AppError(409, 'ATTEMPT_IN_PROGRESS', 'You already have an unfinished attempt on this test', {
      attemptId: unfinished.id,
    })
  }
  if (unfinished) {
    await submit(unfinished)
  }

  const attempt = await Attempt.create({ userId: request.userId, testId: test._id, classId, assignmentId, mode: cleanMode })

  response.status(201).json(withTest(attempt, test))
}

// GET /api/attempts/:attemptId — continue an attempt after a reload (US30, US31, US33)
export async function getAttempt(request, response) {
  const attempt = await findOwnAttempt(request.params.attemptId, request.userId)

  // Time ran out while the page was closed: hand it in now (US31)
  if (attempt.status === 'in_progress' && isPastDeadline(attempt)) {
    await submit(attempt)
  }

  const test = await Test.findById(attempt.testId)
  response.json(withTest(attempt, test))
}

// PATCH /api/attempts/:attemptId/answers — autosave the questions that changed (US33)
export async function saveAnswers(request, response) {
  const attempt = await findOwnAttempt(request.params.attemptId, request.userId)

  if (attempt.status === 'submitted' || isPastDeadline(attempt)) {
    if (attempt.status === 'in_progress') await submit(attempt)
    throw new AppError(409, 'ATTEMPT_CLOSED', 'This attempt is already submitted or out of time')
  }

  const changes = request.body?.answers
  if (!Array.isArray(changes)) {
    throw validationError([{ field: 'answers', message: 'answers must be an array' }])
  }

  // Only questions that belong to the chosen sections can be answered
  const test = await Test.findById(attempt.testId)
  const allowedIds = new Set(listQuestions(test.sections, attempt.mode.sectionIndexes).map((question) => String(question._id)))

  for (const change of changes) {
    const questionId = String(change?.questionId)
    if (!allowedIds.has(questionId) || !Array.isArray(change.value)) {
      throw validationError([{ field: 'answers', message: `invalid answer for question ${questionId}` }])
    }
    const value = change.value.map((item) => String(item))
    const existing = attempt.answers.find((answer) => String(answer.questionId) === questionId)
    if (existing) {
      existing.value = value
    } else {
      attempt.answers.push({ questionId, value })
    }
  }

  await attempt.save()
  response.json({ savedAt: new Date().toISOString(), remainingSec: secondsLeft(attempt) })
}

// POST /api/attempts/:attemptId/submit — hand in early or when time is up, and score it (US31, US32, US35)
// A request delayed by the network can still submit saved answers; this endpoint never accepts edits.
export async function submitAttempt(request, response) {
  const attempt = await findOwnAttempt(request.params.attemptId, request.userId)

  // Submitting twice is harmless: the second call returns the same attempt
  if (attempt.status === 'in_progress') {
    await submit(attempt)
  }

  response.json({ attemptId: attempt.id, status: attempt.status, result: attempt.result })
}

// GET /api/attempts/:attemptId/review — the submitted attempt with answers, explanations and evidence (US36, US37)
// The person who took it can always see it; a teacher can see it when it was made from their class.
export async function reviewAttempt(request, response) {
  const { attemptId } = request.params
  const attempt = mongoose.isValidObjectId(attemptId) ? await Attempt.findById(attemptId) : null
  if (!attempt) throw notFound('Attempt')

  const isOwner = String(attempt.userId) === String(request.userId)
  const isClassTeacher = !isOwner && attempt.classId !== null && (await isTeacherOf(attempt.classId, request.userId))
  if (!isOwner && !isClassTeacher) throw notFound('Attempt')

  // The answers must not leak while the test is still being taken
  if (attempt.status !== 'submitted') {
    throw new AppError(409, 'ATTEMPT_NOT_SUBMITTED', 'This attempt has not been submitted yet')
  }

  const test = await Test.findById(attempt.testId)
  response.json({
    attempt: attempt.toJSON(),
    test: toReviewView(test, attempt.mode.sectionIndexes),
    viewerRole: isOwner ? 'owner' : 'teacher',
  })
}

const HISTORY_RANGES = { '7d': 7, '30d': 30 }

// GET /api/attempts — my history, newest first (US39)
// Filters: status, skill, source (self | class), range (7d | 30d | all), q (test title), page, limit.
export async function listMyAttempts(request, response) {
  const { status, skill, source, range, q } = request.query
  const page = Math.max(Number(request.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(request.query.limit) || 20, 1), 50)

  const filter = { userId: request.userId }
  if (['in_progress', 'submitted'].includes(status)) filter.status = status
  if (source === 'self') filter.classId = null
  if (source === 'class') filter.classId = { $ne: null }
  if (HISTORY_RANGES[range]) {
    filter.startedAt = { $gte: new Date(Date.now() - HISTORY_RANGES[range] * 24 * 60 * 60 * 1000) }
  }

  // Skill and title live on the test, so first find the matching tests among the ones I attempted
  if (['reading', 'listening'].includes(skill) || q) {
    const testFilter = { _id: { $in: await Attempt.distinct('testId', { userId: request.userId }) } }
    if (['reading', 'listening'].includes(skill)) testFilter.skill = skill
    if (q) testFilter.title = { $regex: escapeRegex(q), $options: 'i' }
    filter.testId = { $in: await Test.distinct('_id', testFilter) }
  }

  const [attempts, total] = await Promise.all([
    Attempt.find(filter).sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Attempt.countDocuments(filter),
  ])

  // Titles, covers and class names for the cards, fetched in two queries instead of one per card
  const [tests, classes] = await Promise.all([
    Test.find({ _id: { $in: attempts.map((attempt) => attempt.testId) } }).select('title skill kind coverUrl'),
    Class.find({ _id: { $in: attempts.map((attempt) => attempt.classId).filter(Boolean) } }).select('name'),
  ])
  const testById = new Map(tests.map((test) => [String(test._id), test]))
  const classById = new Map(classes.map((item) => [String(item._id), item]))

  const items = attempts.map((attempt) => {
    const test = testById.get(String(attempt.testId))
    const fromClass = attempt.classId ? classById.get(String(attempt.classId)) : null
    return {
      id: attempt.id,
      status: attempt.status,
      mode: attempt.mode,
      result: attempt.result,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      test: test ? { id: test.id, title: test.title, skill: test.skill, kind: test.kind, coverUrl: test.coverUrl } : null,
      class: fromClass ? { id: fromClass.id, name: fromClass.name } : null,
    }
  })

  response.json({ items, total, page, limit })
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

// GET /api/attempts/activity?from=2026-10-26&to=2026-12-06&tz=Asia/Ho_Chi_Minh
// Submissions per day (by skill) and minutes studied, for the home page calendar and weekly table,
// plus the current streak of days in a row. Days are counted in the viewer's time zone.
export async function getActivity(request, response) {
  const { from, to } = request.query
  if (!DATE_PATTERN.test(from ?? '') || !DATE_PATTERN.test(to ?? '') || from > to) {
    throw validationError([{ field: 'from', message: 'from and to must be dates (yyyy-mm-dd) with from <= to' }])
  }
  if (Date.parse(to) - Date.parse(from) > 62 * DAY_MS) {
    throw validationError([{ field: 'to', message: 'at most 62 days at a time' }])
  }
  const timeZone = safeTimeZone(request.query.tz)

  // A day either side covers every time zone; rows outside from..to are dropped after grouping
  const attempts = await Attempt.find({
    userId: request.userId,
    status: 'submitted',
    submittedAt: { $gte: new Date(Date.parse(from) - DAY_MS), $lt: new Date(Date.parse(to) + 2 * DAY_MS) },
  }).select('testId mode startedAt submittedAt')
  const tests = await Test.find({ _id: { $in: attempts.map((attempt) => attempt.testId) } }).select('skill')
  const skillByTestId = new Map(tests.map((test) => [String(test._id), test.skill]))
  const days = activityByDay(attempts, skillByTestId, timeZone).filter((row) => row.date >= from && row.date <= to)

  // The streak can reach back past "from", so it looks at the last 400 days of submissions
  const recent = await Attempt.find({
    userId: request.userId,
    status: 'submitted',
    submittedAt: { $gte: new Date(Date.now() - 400 * DAY_MS) },
  }).select('submittedAt')
  const activeDates = recent.map((attempt) => dayKey(attempt.submittedAt, timeZone))

  response.json({ days, currentStreak: currentStreak(activeDates, dayKey(new Date(), timeZone)) })
}

// ---- helpers ----

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function findOwnAttempt(attemptId, userId) {
  const attempt = await Attempt.findOne({ _id: attemptId, userId })
  if (!attempt) {
    throw notFound('Attempt')
  }
  return attempt
}

// Closes the attempt and scores it against the test as it is right now.
// The score is stored, so editing the test later does not change it.
async function submit(attempt) {
  const test = await Test.findById(attempt.testId)
  const { answers, result } = gradeAttempt(test, attempt.answers, attempt.mode)

  attempt.answers = answers
  attempt.result = result
  attempt.status = 'submitted'
  attempt.submittedAt = new Date()

  // Homework handed in after the deadline is marked late (US44)
  if (attempt.assignmentId) {
    const assignment = await Assignment.findById(attempt.assignmentId)
    attempt.isLate = assignment !== null && attempt.submittedAt > assignment.deadline
  }

  await attempt.save()
}

// Response shape shared by start and continue: the attempt plus the test without answers
function withTest(attempt, test) {
  return {
    attempt: {
      ...attempt.toJSON(),
      remainingSec: attempt.status === 'in_progress' ? secondsLeft(attempt) : 0,
    },
    test: toPlayView(test),
  }
}
