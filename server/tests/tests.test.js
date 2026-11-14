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

async function createDraft(authHeader, body = { title: 'Practice Test 01', skill: 'reading', kind: 'full' }) {
  const response = await request(app).post('/api/tests').set('Authorization', authHeader).send(body)
  return response.body.test
}

test('US11: creating a full Reading test gives 3 empty passages', async () => {
  const { authHeader } = await createSignedInUser()
  const response = await request(app)
    .post('/api/tests')
    .set('Authorization', authHeader)
    .send({ title: 'Practice Test 01', skill: 'reading', kind: 'full' })

  assert.equal(response.status, 201)
  assert.equal(response.body.test.status, 'draft')
  assert.equal(response.body.test.sections.length, 3)
})

test('US11: missing title, skill or kind is a validation error listing each field', async () => {
  const { authHeader } = await createSignedInUser()
  const response = await request(app).post('/api/tests').set('Authorization', authHeader).send({ skill: 'math' })

  assert.equal(response.status, 400)
  assert.deepEqual(response.body.error.details.map((detail) => detail.field), ['title', 'skill', 'kind'])
})

test('saving renumbers questions and keeps existing question ids', async () => {
  const { authHeader } = await createSignedInUser()
  const draft = await createDraft(authHeader)

  const firstSave = await request(app)
    .put(`/api/tests/${draft.id}`)
    .set('Authorization', authHeader)
    .send({ title: draft.title, sections: sampleSections() })

  assert.equal(firstSave.status, 200)
  assert.equal(firstSave.body.test.questionCount, 3)
  const savedSections = firstSave.body.test.sections
  const firstQuestionId = savedSections[0].groups[0].questions[0].id

  const secondSave = await request(app)
    .put(`/api/tests/${draft.id}`)
    .set('Authorization', authHeader)
    .send({ title: 'Renamed', sections: savedSections })

  assert.equal(secondSave.body.test.title, 'Renamed')
  assert.equal(secondSave.body.test.sections[0].groups[0].questions[0].id, firstQuestionId)
})

test('US19: publishing a test with unanswered questions returns 422 TEST_INCOMPLETE', async () => {
  const { authHeader } = await createSignedInUser()
  const draft = await createDraft(authHeader)
  const sections = sampleSections()
  sections[1].groups[0].questions[0].answers = []
  await request(app).put(`/api/tests/${draft.id}`).set('Authorization', authHeader).send({ title: 'T', sections })

  const response = await request(app)
    .patch(`/api/tests/${draft.id}/status`)
    .set('Authorization', authHeader)
    .send({ status: 'published' })

  assert.equal(response.status, 422)
  assert.equal(response.body.error.code, 'TEST_INCOMPLETE')
  assert.deepEqual(response.body.error.details.questionNumbers, [3])
})

test('US20: another user cannot see, edit or delete my test (404, not 403)', async () => {
  const alice = await createSignedInUser('alice')
  const bob = await createSignedInUser('bob')
  const draft = await createDraft(alice.authHeader)

  const read = await request(app).get(`/api/tests/${draft.id}`).set('Authorization', bob.authHeader)
  const remove = await request(app).delete(`/api/tests/${draft.id}`).set('Authorization', bob.authHeader)

  assert.equal(read.status, 404)
  assert.equal(remove.status, 404)
})

test('US20: my library lists only my tests and filters by skill', async () => {
  const alice = await createSignedInUser('alice')
  const bob = await createSignedInUser('bob')
  await createDraft(alice.authHeader, { title: 'Reading A', skill: 'reading', kind: 'full' })
  await createDraft(alice.authHeader, { title: 'Listening A', skill: 'listening', kind: 'single' })
  await createDraft(bob.authHeader, { title: 'Bob test', skill: 'reading', kind: 'full' })

  const all = await request(app).get('/api/tests').set('Authorization', alice.authHeader)
  const listening = await request(app).get('/api/tests?skill=listening').set('Authorization', alice.authHeader)

  assert.equal(all.body.total, 2)
  assert.deepEqual(listening.body.items.map((item) => item.title), ['Listening A'])
})

test('the play view of a test has no answers', async () => {
  const { authHeader } = await createSignedInUser()
  const draft = await createDraft(authHeader)
  await request(app).put(`/api/tests/${draft.id}`).set('Authorization', authHeader).send({ title: 'T', sections: sampleSections() })

  const response = await request(app).get(`/api/tests/${draft.id}/play`).set('Authorization', authHeader)

  assert.equal(response.status, 200)
  assert.equal(response.body.test.sections[0].groups[0].questions[0].answers, undefined)
})

test('a malformed test id is treated as not found', async () => {
  const { authHeader } = await createSignedInUser()
  const response = await request(app).get('/api/tests/not-an-id').set('Authorization', authHeader)

  assert.equal(response.status, 404)
})

test('US23: filters combine, and "done" splits tests I have submitted from the others', async () => {
  const { authHeader } = await createSignedInUser()
  const taken = await createDraft(authHeader, { title: 'Taken', skill: 'reading', kind: 'full' })
  await createDraft(authHeader, { title: 'Not taken', skill: 'reading', kind: 'full' })
  await createDraft(authHeader, { title: 'Single', skill: 'reading', kind: 'single' })
  await request(app).put(`/api/tests/${taken.id}`).set('Authorization', authHeader).send({ title: 'Taken', sections: sampleSections() })
  const started = await request(app).post('/api/attempts').set('Authorization', authHeader).send({ testId: taken.id, mode: { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 } })
  await request(app).post(`/api/attempts/${started.body.attempt.id}/submit`).set('Authorization', authHeader)

  const done = await request(app).get('/api/tests?done=true').set('Authorization', authHeader)
  const notDoneFull = await request(app).get('/api/tests?done=false&kind=full&skill=reading').set('Authorization', authHeader)

  assert.deepEqual(done.body.items.map((item) => item.title), ['Taken'])
  assert.deepEqual(notDoneFull.body.items.map((item) => item.title), ['Not taken'])
})
