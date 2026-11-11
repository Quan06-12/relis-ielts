import mongoose from 'mongoose'
import { Attempt } from '../models/Attempt.js'
import { Test } from '../models/Test.js'
import { AppError, notFound, validationError } from '../errors/AppError.js'
import { findTestUserCanTake } from '../services/testAccess.js'
import { checkMode } from '../utils/attemptMode.js'
import { secondsLeft, isPastDeadline } from '../utils/attemptTimer.js'
import { listQuestions, toPlayView } from '../utils/testContent.js'

// POST /api/attempts — start taking a test (US24, US25)
export async function startAttempt(request, response) {
  const { testId, mode } = request.body ?? {}
  if (!mongoose.isValidObjectId(testId)) {
    throw validationError([{ field: 'testId', message: 'testId is required' }])
  }

  const test = await findTestUserCanTake(testId, request.userId)
  const cleanMode = checkMode(mode, test)

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

  const attempt = await Attempt.create({ userId: request.userId, testId: test._id, mode: cleanMode })

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

// POST /api/attempts/:attemptId/submit — hand in early or when time is up (US31, US32)
// Sprint 1 only closes the attempt; scoring (US35) is added in Sprint 2.
// A request delayed by the network can still submit saved answers; this endpoint never accepts edits.
export async function submitAttempt(request, response) {
  const attempt = await findOwnAttempt(request.params.attemptId, request.userId)

  // Submitting twice is harmless: the second call returns the same attempt
  if (attempt.status === 'in_progress') {
    await submit(attempt)
  }

  response.json({ attemptId: attempt.id, status: attempt.status, result: attempt.result })
}

// ---- helpers ----

async function findOwnAttempt(attemptId, userId) {
  const attempt = await Attempt.findOne({ _id: attemptId, userId })
  if (!attempt) {
    throw notFound('Attempt')
  }
  return attempt
}

async function submit(attempt) {
  attempt.status = 'submitted'
  attempt.submittedAt = new Date()
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
