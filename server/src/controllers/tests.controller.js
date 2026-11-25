import mongoose from 'mongoose'
import { Test } from '../models/Test.js'
import { AppError, validationError } from '../errors/AppError.js'
import { findOwnedTest, findTestUserCanTake } from '../services/testAccess.js'
import { findLastBands, findDoneTestIds } from '../services/attemptStats.js'
import {
  newTestLayout,
  renumberQuestions,
  findQuestionsWithoutAnswer,
  toPlayView,
  toSummary,
} from '../utils/testContent.js'

const SKILLS = ['reading', 'listening']
const KINDS = ['full', 'single']

// GET /api/tests — my library, newest first (US20, US22, US23)
// source=system lists the published system tests instead of my own.
// Filters combine: skill, kind (full / single), status, q (title), done (true = taken before, false = not yet)
export async function listMyTests(request, response) {
  const { skill, kind, status, q, done, source } = request.query
  const page = Math.max(Number(request.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(request.query.limit) || 20, 1), 50)

  const filter = source === 'system'
    ? { isSystem: true, status: 'published', hidden: false }
    : { ownerId: request.userId, hidden: false }
  if (SKILLS.includes(skill)) filter.skill = skill
  if (KINDS.includes(kind)) filter.kind = kind
  if (source !== 'system' && ['draft', 'published'].includes(status)) filter.status = status
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' }
  if (done === 'true' || done === 'false') {
    const doneIds = await findDoneTestIds(request.userId)
    filter._id = done === 'true' ? { $in: doneIds } : { $nin: doneIds }
  }

  const [tests, total] = await Promise.all([
    Test.find(filter).sort(source === 'system' ? { kind: 1, title: 1 } : { updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Test.countDocuments(filter),
  ])
  const lastBands = await findLastBands(request.userId, tests.map((test) => test._id))

  response.json({ items: tests.map((test) => toSummary(test, lastBands.get(String(test._id)) ?? null)), total, page, limit })
}

// POST /api/tests — a new empty draft (US11)
export async function createTest(request, response) {
  const { title, skill, kind } = request.body ?? {}

  const problems = []
  if (typeof title !== 'string' || title.trim() === '') problems.push({ field: 'title', message: 'title is required' })
  if (!SKILLS.includes(skill)) problems.push({ field: 'skill', message: 'skill must be reading or listening' })
  if (!KINDS.includes(kind)) problems.push({ field: 'kind', message: 'kind must be full or single' })
  if (problems.length > 0) throw validationError(problems)

  const { sections, durationMin } = newTestLayout(skill, kind)
  const test = await Test.create({ ownerId: request.userId, title, skill, kind, sections, durationMin })

  response.status(201).json({ test })
}

// GET /api/tests/:testId — full test with answers, owner only (US20)
export async function getTest(request, response) {
  const test = await findOwnedTest(request.params.testId, request.userId)
  response.json({ test })
}

// PUT /api/tests/:testId — the editor sends the whole test on every save (US12–US18)
export async function saveTest(request, response) {
  const test = await findOwnedTest(request.params.testId, request.userId)
  const { title, coverUrl, durationMin, sections } = request.body ?? {}

  if (!Array.isArray(sections)) {
    throw validationError([{ field: 'sections', message: 'sections must be an array' }])
  }

  // Questions answered before this save, to warn if an answer changes after people took the test
  const answersBefore = answersByQuestionId(test.sections)

  test.title = title
  test.coverUrl = coverUrl ?? null
  if (durationMin !== undefined) test.durationMin = durationMin
  // Existing questions keep their id (attempts point to it); new ones get a fresh id
  test.sections = keepQuestionIds(sections)
  test.questionCount = renumberQuestions(test.sections)

  await test.save()

  const answersChanged = haveAnswersChanged(answersBefore, test.sections)
  const warning = answersChanged && (await hasAttempts(test)) ? 'ANSWERS_CHANGED_AFTER_ATTEMPTS' : null

  response.json({ test, warning })
}

// PATCH /api/tests/:testId/status — publish, or move back to draft (US19)
export async function changeTestStatus(request, response) {
  const test = await findOwnedTest(request.params.testId, request.userId)
  const { status } = request.body ?? {}

  if (!['draft', 'published'].includes(status)) {
    throw validationError([{ field: 'status', message: 'status must be draft or published' }])
  }

  if (status === 'published') {
    const missing = findQuestionsWithoutAnswer(test.sections)
    if (test.questionCount === 0 || missing.length > 0) {
      throw new AppError(422, 'TEST_INCOMPLETE', 'Every question needs an answer before publishing', {
        questionNumbers: missing,
      })
    }
  }

  test.status = status
  await test.save()
  response.json({ test: toSummary(test) })
}

// DELETE /api/tests/:testId — removed for real only if nobody has taken it (US20)
export async function deleteTest(request, response) {
  const test = await findOwnedTest(request.params.testId, request.userId)

  if (await hasAttempts(test)) {
    test.hidden = true
    await test.save()
  } else {
    await test.deleteOne()
  }

  response.status(204).end()
}

// GET /api/tests/:testId/play — the test without answers, for the choose-mode dialog (US24, US26)
export async function getTestForPlay(request, response) {
  const test = await findTestUserCanTake(request.params.testId, request.userId)
  response.json({ test: toPlayView(test) })
}

// ---- helpers ----

// Turn the client's `id` back into Mongo's `_id` so existing questions keep their identity
function keepQuestionIds(sections) {
  return sections.map((section) => ({
    ...section,
    groups: (section.groups ?? []).map((group) => ({
      ...group,
      // `number` is dropped because the server renumbers every question
      questions: (group.questions ?? []).map(({ id, number: _number, ...question }) =>
        mongoose.isValidObjectId(id) ? { ...question, _id: id } : question
      ),
    })),
  }))
}

function answersByQuestionId(sections) {
  const answers = new Map()
  for (const section of sections) {
    for (const group of section.groups) {
      for (const question of group.questions) {
        answers.set(String(question._id), question.answers.join('|'))
      }
    }
  }
  return answers
}

function haveAnswersChanged(answersBefore, sections) {
  const answersAfter = answersByQuestionId(sections)
  return [...answersBefore].some(([questionId, answers]) => answersAfter.has(questionId) && answersAfter.get(questionId) !== answers)
}

// Attempts belong to another feature; we only need to know whether any exist for this test
async function hasAttempts(test) {
  const count = await mongoose.connection.collection('attempts').countDocuments({ testId: test._id }, { limit: 1 })
  return count > 0
}

// A search text like "C++" must not be read as a regular expression
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
