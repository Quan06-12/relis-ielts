import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Test } from '../src/models/Test.js'
import { Class } from '../src/models/Class.js'
import { ClassMember } from '../src/models/ClassMember.js'
import { ClassLibraryItem } from '../src/models/ClassLibraryItem.js'
import { Attempt } from '../src/models/Attempt.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

async function makeTest(ownerId) {
  return Test.create({ ownerId, title: 'Night Train', skill: 'reading', kind: 'single', status: 'published', durationMin: 20 })
}

test('library cards carry my latest submitted attempt and the one still in progress', async () => {
  const { user, authHeader } = await createSignedInUser('lan')
  const savedTest = await makeTest(user._id)
  const mode = { type: 'parts', sectionIndexes: [0], timeLimitMin: 20 }
  const older = await Attempt.create({ userId: user._id, testId: savedTest._id, mode, status: 'submitted', submittedAt: new Date('2026-11-01'), result: { correct: 1, total: 2, band: null, answered: 1 } })
  const newer = await Attempt.create({ userId: user._id, testId: savedTest._id, mode, status: 'submitted', submittedAt: new Date('2026-11-20'), result: { correct: 2, total: 2, band: null, answered: 2 } })
  const open = await Attempt.create({ userId: user._id, testId: savedTest._id, mode, status: 'in_progress', expiresAt: new Date(Date.now() + 600000) })
  await Attempt.updateOne({ _id: older._id }, { $set: { updatedAt: new Date('2026-11-01') } }, { timestamps: false })

  const response = await request(app).get('/api/tests').set('Authorization', authHeader)
  const [card] = response.body.items
  assert.equal(card.lastAttemptId, newer.id)
  assert.equal(card.openAttemptId, open.id)
})

test('a test never taken has no attempt links', async () => {
  const { user, authHeader } = await createSignedInUser('lan')
  await makeTest(user._id)
  const [card] = (await request(app).get('/api/tests').set('Authorization', authHeader)).body.items
  assert.equal(card.lastAttemptId, null)
  assert.equal(card.openAttemptId, null)
})

test('GET /tests/:id/classes lists only the classes I teach that already hold the test', async () => {
  const { user: teacher, authHeader } = await createSignedInUser('teacher')
  const { user: other } = await createSignedInUser('other')
  const savedTest = await makeTest(teacher._id)
  const [withTest, withoutTest, notMine] = await Class.create([
    { name: 'A', code: 'AAA234', createdBy: teacher._id },
    { name: 'B', code: 'BBB234', createdBy: teacher._id },
    { name: 'C', code: 'CCC234', createdBy: other._id },
  ])
  await ClassMember.create([
    { classId: withTest._id, userId: teacher._id, role: 'teacher' },
    { classId: withoutTest._id, userId: teacher._id, role: 'teacher' },
    { classId: notMine._id, userId: other._id, role: 'teacher' },
  ])
  await ClassLibraryItem.create([
    { classId: withTest._id, testId: savedTest._id, addedBy: teacher._id },
    { classId: notMine._id, testId: savedTest._id, addedBy: other._id },
  ])

  const response = await request(app).get(`/api/tests/${savedTest.id}/classes`).set('Authorization', authHeader)
  assert.equal(response.status, 200)
  assert.deepEqual(response.body.classIds, [withTest.id])
})
