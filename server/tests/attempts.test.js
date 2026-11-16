import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Attempt } from '../src/models/Attempt.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'
import { sampleSections } from './helpers/sampleTest.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

// A saved test with 2 passages and 3 questions, owned by the signed-in user
async function setUp() {
  const { authHeader } = await createSignedInUser()
  const created = await request(app).post('/api/tests').set('Authorization', authHeader).send({ title: 'T', skill: 'reading', kind: 'full' })
  const saved = await request(app)
    .put(`/api/tests/${created.body.test.id}`)
    .set('Authorization', authHeader)
    .send({ title: 'T', sections: sampleSections() })
  return { authHeader, test: saved.body.test }
}

const fullMode = { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 }

test('US24: starting an attempt returns the attempt and the test without answers', async () => {
  const { authHeader, test: savedTest } = await setUp()

  const response = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })

  assert.equal(response.status, 201)
  assert.equal(response.body.attempt.status, 'in_progress')
  assert.equal(response.body.attempt.remainingSec, 3600)
  assert.equal(JSON.stringify(response.body.test).includes('answers'), false)
})

test('a test without any question cannot be started', async () => {
  const { authHeader } = await createSignedInUser()
  const created = await request(app).post('/api/tests').set('Authorization', authHeader).send({ title: 'Empty', skill: 'reading', kind: 'full' })

  const response = await request(app)
    .post('/api/attempts')
    .set('Authorization', authHeader)
    .send({ testId: created.body.test.id, mode: { type: 'full', sectionIndexes: [0, 1, 2], timeLimitMin: 60 } })

  assert.equal(response.status, 422)
  assert.equal(response.body.error.code, 'NO_QUESTIONS')
})

test('US33: starting the same test again while unfinished returns 409 with the attempt id', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const first = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })

  const second = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })

  assert.equal(second.status, 409)
  assert.equal(second.body.error.code, 'ATTEMPT_IN_PROGRESS')
  assert.equal(second.body.error.details.attemptId, first.body.attempt.id)
})

test('US33: saved answers come back when the attempt is reopened', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })
  const attemptId = started.body.attempt.id
  const questionId = started.body.test.sections[0].groups[0].questions[0].id

  const save = await request(app)
    .patch(`/api/attempts/${attemptId}/answers`)
    .set('Authorization', authHeader)
    .send({ answers: [{ questionId, value: ['TRUE'] }] })
  const reopened = await request(app).get(`/api/attempts/${attemptId}`).set('Authorization', authHeader)

  assert.equal(save.status, 200)
  assert.deepEqual(reopened.body.attempt.answers, [{ questionId, value: ['TRUE'] }])
})

test('answers for a section outside the chosen mode are rejected', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app)
    .post('/api/attempts')
    .set('Authorization', authHeader)
    .send({ testId: savedTest.id, mode: { type: 'parts', sectionIndexes: [0], timeLimitMin: 20 } })
  const questionInPassage2 = savedTest.sections[1].groups[0].questions[0].id

  const response = await request(app)
    .patch(`/api/attempts/${started.body.attempt.id}/answers`)
    .set('Authorization', authHeader)
    .send({ answers: [{ questionId: questionInPassage2, value: ['pedals'] }] })

  assert.equal(response.status, 400)
})

test('US32: submitting closes the attempt, and submitting twice is harmless', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })
  const attemptId = started.body.attempt.id

  const first = await request(app).post(`/api/attempts/${attemptId}/submit`).set('Authorization', authHeader)
  const second = await request(app).post(`/api/attempts/${attemptId}/submit`).set('Authorization', authHeader)
  const lateSave = await request(app).patch(`/api/attempts/${attemptId}/answers`).set('Authorization', authHeader).send({ answers: [] })

  assert.equal(first.body.status, 'submitted')
  assert.equal(second.status, 200)
  assert.equal(lateSave.status, 409)
  assert.equal(lateSave.body.error.code, 'ATTEMPT_CLOSED')
})

test('US31: an attempt whose time ran out is submitted when reopened', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })
  const attemptId = started.body.attempt.id
  // The deadline passed five seconds ago: reopening must not grant extra answering time.
  await Attempt.updateOne({ _id: attemptId }, { startedAt: new Date(Date.now() - (60 * 60 + 5) * 1000) })

  const reopened = await request(app).get(`/api/attempts/${attemptId}`).set('Authorization', authHeader)

  assert.equal(reopened.body.attempt.status, 'submitted')
  assert.equal(reopened.body.attempt.remainingSec, 0)
})

test('answers sent five seconds late are rejected without changing saved answers', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })
  const attemptId = started.body.attempt.id
  const questionId = started.body.test.sections[0].groups[0].questions[0].id

  const saved = await request(app)
    .patch(`/api/attempts/${attemptId}/answers`)
    .set('Authorization', authHeader)
    .send({ answers: [{ questionId, value: ['TRUE'] }] })
  assert.equal(saved.status, 200)
  await Attempt.updateOne({ _id: attemptId }, { startedAt: new Date(Date.now() - (60 * 60 + 5) * 1000) })

  const lateSave = await request(app)
    .patch(`/api/attempts/${attemptId}/answers`)
    .set('Authorization', authHeader)
    .send({ answers: [{ questionId, value: ['FALSE'] }] })
  assert.equal(lateSave.status, 409)
  assert.equal(lateSave.body.error.code, 'ATTEMPT_CLOSED')

  const reopened = await request(app).get(`/api/attempts/${attemptId}`).set('Authorization', authHeader)
  assert.equal(reopened.body.attempt.status, 'submitted')
  // Scoring adds every question to answers; the one saved before the deadline keeps its value
  const kept = reopened.body.attempt.answers.find((answer) => answer.questionId === questionId)
  assert.deepEqual(kept, { questionId, value: ['TRUE'], correct: true })
})

test('a submit request delayed five seconds closes saved answers and remains repeatable', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })
  const attemptId = started.body.attempt.id
  const questionId = started.body.test.sections[0].groups[0].questions[0].id

  const saved = await request(app)
    .patch(`/api/attempts/${attemptId}/answers`)
    .set('Authorization', authHeader)
    .send({ answers: [{ questionId, value: ['TRUE'] }] })
  assert.equal(saved.status, 200)
  await Attempt.updateOne({ _id: attemptId }, { startedAt: new Date(Date.now() - (60 * 60 + 5) * 1000) })

  const first = await request(app).post(`/api/attempts/${attemptId}/submit`).set('Authorization', authHeader)
  const second = await request(app).post(`/api/attempts/${attemptId}/submit`).set('Authorization', authHeader)
  assert.equal(first.status, 200)
  assert.equal(first.body.status, 'submitted')
  assert.deepEqual(first.body.result, { correct: 1, total: 3, band: null })
  assert.equal(second.status, 200)
  assert.deepEqual(second.body, first.body)

  const reopened = await request(app).get(`/api/attempts/${attemptId}`).set('Authorization', authHeader)
  // Scoring adds every question to answers; the one saved before the deadline keeps its value
  const kept = reopened.body.attempt.answers.find((answer) => answer.questionId === questionId)
  assert.deepEqual(kept, { questionId, value: ['TRUE'], correct: true })
})

test("another user's attempt is not found", async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })
  const bob = await createSignedInUser('bob')

  const response = await request(app).get(`/api/attempts/${started.body.attempt.id}`).set('Authorization', bob.authHeader)

  assert.equal(response.status, 404)
})

test('US42: activity counts today\'s submission by skill and starts a streak of 1', async () => {
  const { authHeader, test: savedTest } = await setUp()
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: savedTest.id, mode: fullMode })
  await request(app).post(`/api/attempts/${started.body.attempt.id}/submit`).set('Authorization', authHeader)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date())

  const response = await request(app)
    .get('/api/attempts/activity')
    .query({ from: today, to: today, tz: 'UTC' })
    .set('Authorization', authHeader)

  assert.equal(response.status, 200)
  assert.equal(response.body.days.length, 1)
  assert.equal(response.body.days[0].date, today)
  assert.equal(response.body.days[0].reading, 1)
  assert.equal(response.body.currentStreak, 1)
})

test('US42: activity refuses a range that is not two dates', async () => {
  const { authHeader } = await createSignedInUser()

  const response = await request(app).get('/api/attempts/activity').query({ from: 'yesterday', to: '2026-11-14' }).set('Authorization', authHeader)

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
})

test('US42: study time lists the last months with minutes per skill', async () => {
  const { authHeader } = await setUp()

  const response = await request(app).get('/api/attempts/study-time?months=3&tz=Asia/Ho_Chi_Minh').set('Authorization', authHeader)

  assert.equal(response.status, 200)
  assert.equal(response.body.months.length, 3)
  assert.deepEqual(Object.keys(response.body.months[0]).sort(), ['listeningMinutes', 'month', 'readingMinutes'])
})

