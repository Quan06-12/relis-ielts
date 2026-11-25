import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'
import { sampleSections } from './helpers/sampleTest.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

const fullMode = { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 }

// A user with the 3-question sample test who has started one attempt on it
async function setUp() {
  const user = await createSignedInUser('alice')
  const created = await request(app).post('/api/tests').set('Authorization', user.authHeader).send({ title: 'Rooftops', skill: 'reading', kind: 'full' })
  const testId = created.body.test.id
  await request(app).put(`/api/tests/${testId}`).set('Authorization', user.authHeader).send({ title: 'Rooftops', sections: sampleSections() })

  const started = await request(app).post('/api/attempts').set('Authorization', user.authHeader).send({ testId, mode: fullMode })
  const questions = started.body.test.sections.flatMap((section) => section.groups.flatMap((group) => group.questions))

  return { user, testId, attemptId: started.body.attempt.id, questions }
}

function answer(user, attemptId, answers) {
  return request(app).patch(`/api/attempts/${attemptId}/answers`).set('Authorization', user.authHeader).send({ answers })
}

function submit(user, attemptId) {
  return request(app).post(`/api/attempts/${attemptId}/submit`).set('Authorization', user.authHeader)
}

test('US35: submitting scores the attempt; case and spaces are ignored', async () => {
  const { user, attemptId, questions } = await setUp()
  await answer(user, attemptId, [
    { questionId: questions[0].id, value: ['TRUE'] }, // right
    { questionId: questions[1].id, value: ['TRUE'] }, // wrong, the answer is FALSE
    { questionId: questions[2].id, value: ['  Pedals '] }, // right
  ])

  const response = await submit(user, attemptId)

  assert.equal(response.status, 200)
  assert.deepEqual(response.body.result, { correct: 2, total: 3, band: null, answered: 3 })
})

test('US36: the review has every answer marked, with the correct answers and the passage', async () => {
  const { user, attemptId, questions } = await setUp()
  await answer(user, attemptId, [{ questionId: questions[0].id, value: ['TRUE'] }])
  await submit(user, attemptId)

  const response = await request(app).get(`/api/attempts/${attemptId}/review`).set('Authorization', user.authHeader)

  assert.equal(response.status, 200)
  assert.equal(response.body.viewerRole, 'owner')
  assert.deepEqual(response.body.attempt.answers.map((item) => item.correct), [true, false, false])
  assert.deepEqual(response.body.test.sections[0].groups[0].questions[1].answers, ['FALSE'])
  assert.ok(response.body.test.sections[0].passage.length > 0)
})

test('US36: the review is not available while the attempt is in progress', async () => {
  const { user, attemptId } = await setUp()

  const response = await request(app).get(`/api/attempts/${attemptId}/review`).set('Authorization', user.authHeader)

  assert.equal(response.status, 409)
  assert.equal(response.body.error.code, 'ATTEMPT_NOT_SUBMITTED')
})

test("US36: another user cannot see someone else's review", async () => {
  const { user, attemptId } = await setUp()
  await submit(user, attemptId)
  const stranger = await createSignedInUser('bob')

  const response = await request(app).get(`/api/attempts/${attemptId}/review`).set('Authorization', stranger.authHeader)

  assert.equal(response.status, 404)
})

test('US36: editing the test after submitting does not change the score', async () => {
  const { user, testId, attemptId, questions } = await setUp()
  await answer(user, attemptId, [{ questionId: questions[0].id, value: ['TRUE'] }])
  await submit(user, attemptId)

  // The teacher changes the answer of question 1 to FALSE
  const sections = sampleSections()
  sections[0].groups[0].questions[0].answers = ['FALSE']
  await request(app).put(`/api/tests/${testId}`).set('Authorization', user.authHeader).send({ title: 'Rooftops', sections })

  const history = await request(app).get('/api/attempts').set('Authorization', user.authHeader)

  assert.equal(history.body.items[0].result.correct, 1)
})

test('US39: history lists my attempts newest first, with the test title', async () => {
  const { user, attemptId } = await setUp()
  await submit(user, attemptId)

  const response = await request(app).get('/api/attempts').set('Authorization', user.authHeader)

  assert.equal(response.status, 200)
  assert.equal(response.body.total, 1)
  assert.equal(response.body.items[0].test.title, 'Rooftops')
  assert.equal(response.body.items[0].class, null)
})

test('US39: history filters by status, skill and title', async () => {
  const { user, attemptId } = await setUp()
  await submit(user, attemptId)

  const inProgress = await request(app).get('/api/attempts?status=in_progress').set('Authorization', user.authHeader)
  const listening = await request(app).get('/api/attempts?skill=listening').set('Authorization', user.authHeader)
  const byTitle = await request(app).get('/api/attempts?q=roof').set('Authorization', user.authHeader)
  const fromClass = await request(app).get('/api/attempts?source=class').set('Authorization', user.authHeader)

  assert.equal(inProgress.body.total, 0)
  assert.equal(listening.body.total, 0)
  assert.equal(byTitle.body.total, 1)
  assert.equal(fromClass.body.total, 0)
})

test('US39: history never shows other users’ attempts', async () => {
  const { user, attemptId } = await setUp()
  await submit(user, attemptId)
  const other = await createSignedInUser('bob')

  const response = await request(app).get('/api/attempts').set('Authorization', other.authHeader)

  assert.equal(response.body.total, 0)
})

test('US41: the teacher of the class can open a review made from that class', async () => {
  const teacher = await createSignedInUser('teacher')
  const student = await createSignedInUser('student')

  // Teacher: a published test in the library of a new class
  const created = await request(app).post('/api/tests').set('Authorization', teacher.authHeader).send({ title: 'Class test', skill: 'reading', kind: 'full' })
  const testId = created.body.test.id
  await request(app).put(`/api/tests/${testId}`).set('Authorization', teacher.authHeader).send({ title: 'Class test', sections: sampleSections() })
  await request(app).patch(`/api/tests/${testId}/status`).set('Authorization', teacher.authHeader).send({ status: 'published' })
  const newClass = await request(app).post('/api/classes').set('Authorization', teacher.authHeader).send({ name: 'Class A' })
  const classId = newClass.body.class.id
  await request(app).post(`/api/classes/${classId}/library`).set('Authorization', teacher.authHeader).send({ testIds: [testId] })

  // Student: joins, takes the test from the class and submits
  await request(app).post('/api/classes/join').set('Authorization', student.authHeader).send({ code: newClass.body.class.code })
  const started = await request(app).post('/api/attempts').set('Authorization', student.authHeader).send({ testId, classId, mode: fullMode })
  await submit(student, started.body.attempt.id)

  const review = await request(app).get(`/api/attempts/${started.body.attempt.id}/review`).set('Authorization', teacher.authHeader)
  const history = await request(app).get('/api/attempts?source=class').set('Authorization', student.authHeader)

  assert.equal(review.status, 200)
  assert.equal(review.body.viewerRole, 'teacher')
  assert.equal(history.body.items[0].class.name, 'Class A')
})

test('US18, US37: evidence saved in the editor comes back in the review as a plain range', async () => {
  const { user, testId, attemptId } = await setUp()
  const sections = sampleSections()
  sections[0].groups[0].questions[0].evidence = { start: 0, end: 12 }
  await request(app).put(`/api/tests/${testId}`).set('Authorization', user.authHeader).send({ title: 'Rooftops', sections })
  await submit(user, attemptId)

  const review = await request(app).get(`/api/attempts/${attemptId}/review`).set('Authorization', user.authHeader)

  assert.deepEqual(review.body.test.sections[0].groups[0].questions[0].evidence, { start: 0, end: 12 })
})
