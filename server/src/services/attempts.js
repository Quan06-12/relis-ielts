import { randomBytes } from 'node:crypto'
import { ApiError, checkId, invalid, notFound } from '../utils/errors.js'
import { grade, questionsFor } from '../utils/grade.js'
import { toPlayView } from '../utils/playView.js'
import { overallBand } from '../utils/band.js'

const id = () => randomBytes(12).toString('hex')
const iso = (ms) => new Date(ms).toISOString()
const defaultAccess = {
  canPlay: async (test, userId) => test.ownerId === userId,
  canReview: async () => false,
}
export function createAttemptService(repo, { now = Date.now, access = defaultAccess } = {}) {
  const remaining = (a) => Math.max(0, Math.ceil((Date.parse(a.expiresAt) - now()) / 1000))
  const view = (a) => ({
    id: a.id,
    testId: a.testId,
    assignmentId: a.assignmentId,
    mode: a.mode,
    status: a.status,
    answers: a.answers,
    remainingSec: a.status === 'submitted' ? 0 : remaining(a),
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    result: a.result,
  })
  async function owned(attemptId, userId, review = false) {
    const a = await repo.getAttempt(checkId(attemptId))
    if (
      !a ||
      (a.userId !== userId && !(review && a.classId && (await access.canReview(a, userId))))
    )
      throw notFound()
    return a
  }
  async function finish(a) {
    for (let tries = 0; tries < 20; tries++) {
      if (a.status === 'submitted') return a
      const grading = grade(a.snapshot, a.answers, a.mode)
      const updated = await repo.compareAndSet(
        {
          ...a,
          status: 'submitted',
          submittedAt: iso(Math.min(now(), Date.parse(a.expiresAt))),
          result: grading.result,
          grading: grading.questions,
        },
        a.revision,
      )
      if (updated) return updated
      a = await repo.getAttempt(a.id)
    }
    throw new ApiError(409, 'ATTEMPT_BUSY')
  }
  async function expire(a) {
    return a.status === 'in_progress' && remaining(a) === 0 ? finish(a) : a
  }
  async function playable(testId, userId) {
    const test = await repo.getTest(checkId(testId))
    if (!test || test.hidden || !(await access.canPlay(test, userId))) throw notFound()
    return test
  }
  function validateMode(test, mode) {
    if (
      !mode ||
      !['full', 'parts'].includes(mode.type) ||
      !Number.isInteger(mode.timeLimitMin) ||
      mode.timeLimitMin < 1 ||
      mode.timeLimitMin > 180
    )
      throw invalid('mode')
    const indexes = mode.sectionIndexes
    if (
      !Array.isArray(indexes) ||
      !indexes.length ||
      new Set(indexes).size !== indexes.length ||
      indexes.some((n) => !Number.isInteger(n) || n < 0 || n >= test.sections.length)
    )
      throw invalid('mode.sectionIndexes')
    if (mode.type === 'full' && (test.kind !== 'full' || indexes.length !== test.sections.length))
      throw invalid('mode.type')
    const selected = {
      type: mode.type,
      sectionIndexes: [...indexes].sort((a, b) => a - b),
      timeLimitMin: mode.timeLimitMin,
    }
    if (!questionsFor(test, selected).length) throw invalid('test')
    return selected
  }
  function validAnswers(a, answers) {
    const questions = new Map(questionsFor(a.snapshot, a.mode).map((q) => [q.id, q]))
    if (!Array.isArray(answers) || answers.length > questions.size) throw invalid('answers')
    const seen = new Set()
    return answers.map((answer) => {
      const q = questions.get(answer?.questionId)
      if (
        !q ||
        seen.has(q.id) ||
        !Array.isArray(answer.value) ||
        answer.value.length > (q.type === 'multi_select' ? q.options?.length || 20 : 1) ||
        answer.value.some((v) => typeof v !== 'string' || v.length > 2000)
      )
        throw invalid('answers')
      seen.add(q.id)
      return { questionId: q.id, value: [...new Set(answer.value)] }
    })
  }
  async function list(userId, query = {}) {
    const page = Number(query.page ?? 1),
      limit = Number(query.limit ?? 20)
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50)
      throw invalid('pagination')
    if (query.skill && !['reading', 'listening'].includes(query.skill)) throw invalid('skill')
    if (query.status && !['in_progress', 'submitted'].includes(query.status))
      throw invalid('status')
    const attempts = await Promise.all((await repo.listAttempts(userId)).map(expire))
    const filtered = attempts.filter(
      (a) =>
        (!query.skill || a.snapshot.skill === query.skill) &&
        (!query.status || a.status === query.status),
    )
    return {
      items: filtered.slice((page - 1) * limit, page * limit).map(history),
      total: filtered.length,
      page,
      limit,
    }
  }
  function history(a) {
    return { ...view(a), title: a.snapshot.title, skill: a.snapshot.skill }
  }
  return {
    async play(testId, userId) {
      return { test: toPlayView(await playable(testId, userId)) }
    },
    async start(userId, input = {}) {
      // A's assignment policy is not implemented. Never accept caller-supplied class context.
      if (input.assignmentId != null || input.classId != null) throw invalid('assignmentId')
      const test = await playable(input.testId, userId)
      const context = access.playContext ? await access.playContext(test, userId) : {}
      if (context.classId != null) checkId(context.classId)
      const mode = validateMode(test, input.mode)
      if (questionsFor(test, mode).some((q) => !q.answers?.length))
        throw new ApiError(422, 'TEST_INCOMPLETE')
      const active = await repo.activeAttempt(userId, test.id)
      if (active && (await expire(active)).status === 'in_progress')
        throw new ApiError(409, 'ATTEMPT_IN_PROGRESS', { attemptId: active.id })
      const started = now()
      const doc = {
        id: id(),
        userId,
        testId: test.id,
        classId: context.classId || null,
        assignmentId: null,
        mode,
        snapshot: structuredClone(test),
        status: 'in_progress',
        answers: [],
        result: null,
        grading: [],
        startedAt: iso(started),
        expiresAt: iso(started + mode.timeLimitMin * 60000),
        submittedAt: null,
        revision: 0,
      }
      const created = await repo.createAttempt(doc)
      if (!created)
        throw new ApiError(409, 'ATTEMPT_IN_PROGRESS', {
          attemptId: (await repo.activeAttempt(userId, test.id))?.id,
        })
      return { attempt: view(created), test: toPlayView(created.snapshot) }
    },
    async get(attemptId, userId) {
      const a = await expire(await owned(attemptId, userId))
      return { attempt: view(a), test: toPlayView(a.snapshot) }
    },
    async save(attemptId, userId, answers) {
      for (let tries = 0; tries < 20; tries++) {
        const a = await expire(await owned(attemptId, userId))
        if (a.status !== 'in_progress') throw new ApiError(409, 'ATTEMPT_CLOSED')
        const patch = validAnswers(a, answers)
        const merged = new Map(a.answers.map((answer) => [answer.questionId, answer]))
        patch.forEach((answer) => merged.set(answer.questionId, answer))
        const saved = await repo.compareAndSet(
          { ...a, answers: [...merged.values()] },
          a.revision,
          true,
        )
        if (saved) return { savedAt: iso(now()), remainingSec: remaining(saved) }
      }
      throw new ApiError(409, 'ATTEMPT_BUSY')
    },
    async submit(attemptId, userId) {
      const a = await finish(await owned(attemptId, userId))
      return { attemptId: a.id, status: a.status, result: a.result }
    },
    async review(attemptId, userId) {
      const a = await expire(await owned(attemptId, userId, true))
      if (a.status !== 'submitted') throw new ApiError(409, 'ATTEMPT_NOT_SUBMITTED')
      // Explicit fields keep ownerId and any future internal fields out of responses.
      return {
        attempt: view(a),
        test: { ...toPlayView(a.snapshot), sections: a.snapshot.sections },
        questions: a.grading,
      }
    },
    list,
    async dashboard(userId) {
      const attempts = await Promise.all((await repo.listAttempts(userId)).map(expire))
      const submitted = attempts
        .filter((a) => a.status === 'submitted')
        .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
      const band = (skill) =>
        submitted.find((a) => a.snapshot.skill === skill && a.result?.band != null)?.result.band ??
        null
      const reading = band('reading'),
        listening = band('listening')
      return {
        reading,
        listening,
        overall: overallBand(reading, listening),
        submittedCount: submitted.length,
        recent: attempts.slice(0, 5).map(history),
      }
    },
  }
}
