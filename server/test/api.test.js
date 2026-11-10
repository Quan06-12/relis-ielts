import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../src/app.js'
import { createMemoryRepository } from '../src/dev/memoryRepository.js'
import { fixtureTests, DEV_USER } from '../src/dev/fixtures.js'
import { readConfig } from '../src/config/env.js'

const secret = 'test-only-secret-with-at-least-32-characters'
const other = '999999999999999999999999'
function setup(options = {}) {
  let time = Date.parse('2026-11-10T01:00:00Z')
  const tests = fixtureTests(),
    repo = createMemoryRepository(tests)
  const app = createApp({
    repo,
    config: { jwtSecret: secret, clientUrl: 'http://localhost:5173' },
    now: () => time,
    ...options,
  })
  const as = (userId = DEV_USER) => `Bearer ${jwt.sign({ userId }, secret)}`
  const api = (method, path, body, userId) =>
    request(app)[method](`/api${path}`).set('Authorization', as(userId)).send(body)
  const start = (body = {}) =>
    api('post', '/attempts', {
      testId: tests[0].id,
      mode: { type: 'full', sectionIndexes: [0, 1, 2], timeLimitMin: 1 },
      ...body,
    })
  return {
    app,
    tests,
    repo,
    api,
    start,
    advance: (ms) => {
      time += ms
    },
  }
}
test('health, CORS, JWT, bad JSON and validation envelopes', async () => {
  const { app, api, start } = setup()
  assert.deepEqual((await request(app).get('/api/health')).body, { ok: true })
  assert.equal((await request(app).get('/api/dashboard')).status, 401)
  const cors = await request(app).get('/api/health').set('Origin', 'https://evil.test')
  assert.equal(cors.headers['access-control-allow-origin'], 'http://localhost:5173')
  assert.equal(
    (await request(app).post('/api/attempts').set('Content-Type', 'application/json').send('{'))
      .body.error.code,
    'INVALID_JSON',
  )
  assert.equal(
    (await start({ mode: { type: 'full', sectionIndexes: [0], timeLimitMin: 1 } })).status,
    400,
  )
  assert.equal((await api('get', '/attempts?page=-1')).status, 400)
  assert.equal((await start({ assignmentId: other })).status, 400)
  assert.throws(() => readConfig({ JWT_SECRET: 'x' }), /JWT_SECRET/)
  assert.throws(
    () =>
      readConfig({
        JWT_SECRET: secret,
        MONGODB_URI: 'mongodb://localhost/test',
        NODE_ENV: 'production',
        DEV_FIXTURES: 'true',
      }),
    /forbidden/,
  )
})
test('end-to-end start, save, restore, submit, immutable review/history/dashboard', async () => {
  const { api, start, tests } = setup()
  const started = await start()
  assert.equal(started.status, 201)
  const id = started.body.attempt.id
  const safe = JSON.stringify(started.body)
  for (const field of ['"explanation"', '"evidence"', '"transcript"', '"snapshot"', '"ownerId"'])
    assert.ok(!safe.includes(field))
  assert.equal(started.body.test.sections[0].groups[0].questions[0].answers, undefined)
  assert.equal((await api('get', `/attempts/${id}/review`)).status, 409)
  const answers = tests[0].sections.flatMap((s) =>
    s.groups.flatMap((g) =>
      g.questions.map((q) => ({
        questionId: q.id,
        value: g.type === 'multi_select' ? q.answers : [q.answers[0]],
      })),
    ),
  )
  assert.equal((await api('patch', `/attempts/${id}/answers`, { answers })).status, 200)
  assert.deepEqual((await api('get', `/attempts/${id}`)).body.attempt.answers, answers)
  assert.equal((await api('get', `/attempts/${id}`, null, other)).status, 404)
  assert.equal((await api('get', `/tests/${tests[0].id}/play`, null, other)).status, 404)
  // Mutating A's source after start cannot mutate scoring or review snapshot.
  tests[0].sections[0].groups[0].questions[0].answers = ['changed']
  const submits = await Promise.all([
    api('post', `/attempts/${id}/submit`),
    api('post', `/attempts/${id}/submit`),
  ])
  assert.deepEqual(submits[0].body, submits[1].body)
  assert.deepEqual(submits[0].body.result, { correct: 40, total: 40, band: 9 })
  assert.equal(
    (await api('get', `/attempts/${id}/review`)).body.questions.filter((q) => q.correct).length,
    40,
  )
  assert.equal((await api('get', '/attempts?skill=reading&status=submitted')).body.total, 1)
  assert.equal((await api('get', '/attempts', null, other)).body.total, 0)
  assert.equal((await api('get', '/dashboard')).body.reading, 9)
  assert.equal((await api('patch', `/attempts/${id}/answers`, { answers: [] })).status, 409)
})
test('expiry rejects new answers, auto-submits on resume; duplicates and patches across tabs', async () => {
  const { api, start, tests, advance } = setup()
  const starts = await Promise.all([start(), start()])
  assert.deepEqual(starts.map((r) => r.status).sort(), [201, 409])
  const id = starts.find((r) => r.status === 201).body.attempt.id
  const qs = tests[0].sections[0].groups.map((g) => g.questions[0])
  await Promise.all(
    qs
      .slice(0, 2)
      .map((q) =>
        api('patch', `/attempts/${id}/answers`, {
          answers: [{ questionId: q.id, value: [q.answers[0]] }],
        }),
      ),
  )
  assert.equal((await api('get', `/attempts/${id}`)).body.attempt.answers.length, 2)
  const invalid = await api('patch', `/attempts/${id}/answers`, {
    answers: [{ questionId: other, value: ['x'] }],
  })
  assert.equal(invalid.status, 400)
  advance(60001)
  assert.equal(
    (
      await api('patch', `/attempts/${id}/answers`, {
        answers: [{ questionId: qs[0].id, value: ['bad'] }],
      })
    ).body.error.code,
    'ATTEMPT_CLOSED',
  )
  const restored = (await api('get', `/attempts/${id}`)).body.attempt
  assert.equal(restored.status, 'submitted')
  assert.equal(restored.result.correct, 2)
  assert.deepEqual((await api('post', `/attempts/${id}/submit`)).body.result, restored.result)
  assert.equal((await start()).status, 201)
})
test('clear answer persists; malformed values fail; parts never get band; vocab ownership', async () => {
  const { api, start, tests } = setup()
  const id = (await start({ mode: { type: 'parts', sectionIndexes: [0], timeLimitMin: 1 } })).body
    .attempt.id
  const questionId = tests[0].sections[0].groups[0].questions[0].id
  await api('patch', `/attempts/${id}/answers`, { answers: [{ questionId, value: ['ten'] }] })
  await api('patch', `/attempts/${id}/answers`, { answers: [{ questionId, value: [] }] })
  assert.deepEqual((await api('get', `/attempts/${id}`)).body.attempt.answers[0].value, [])
  assert.equal(
    (await api('patch', `/attempts/${id}/answers`, { answers: [{ questionId, value: [123] }] }))
      .status,
    400,
  )
  assert.equal((await api('post', `/attempts/${id}/submit`)).body.result.band, null)
  const data = {
    title: 'Transport',
    words: [{ term: 'bus', meaning: 'xe buýt', example: 'A red bus.' }],
  }
  const created = await api('post', '/vocab-sets', data)
  assert.equal(created.status, 201)
  const setId = created.body.set.id
  assert.equal((await api('get', `/vocab-sets/${setId}`, null, other)).status, 404)
  assert.equal((await api('put', `/vocab-sets/${setId}`, data, other)).status, 404)
  assert.equal((await api('delete', `/vocab-sets/${setId}`, null, other)).status, 404)
  assert.equal(
    (await api('put', `/vocab-sets/${setId}`, { ...data, title: 'Updated' })).body.set.title,
    'Updated',
  )
  assert.equal((await api('delete', `/vocab-sets/${setId}`)).status, 204)
})

test('class review adapter permits only verified teacher; production app has no fixture endpoints', async () => {
  const teacher = '888888888888888888888888'
  const classId = '777777777777777777777777'
  const { api, start, app } = setup({
    access: {
      canPlay: async (test, userId) => test.ownerId === userId,
      playContext: async () => ({ classId }),
      canReview: async (attempt, userId) => attempt.classId === classId && userId === teacher,
    },
  })
  const id = (await start()).body.attempt.id
  await api('post', `/attempts/${id}/submit`)
  assert.equal((await api('get', `/attempts/${id}/review`, null, teacher)).status, 200)
  assert.equal((await api('get', `/attempts/${id}/review`, null, other)).status, 404)
  assert.equal((await api('get', `/attempts/${id}`, null, teacher)).status, 404)
  assert.equal((await api('post', '/dev/session')).status, 404)
  assert.equal((await api('get', '/auth/me')).status, 404)
  assert.equal(
    (
      await request(app)
        .get('/api/dashboard')
        .set(
          'Authorization',
          `Bearer ${jwt.sign({ userId: DEV_USER }, secret, { algorithm: 'HS384' })}`,
        )
    ).status,
    401,
  )
})
