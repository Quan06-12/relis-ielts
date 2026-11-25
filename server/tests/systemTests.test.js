import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Test } from '../src/models/Test.js'
import { Class } from '../src/models/Class.js'
import { ClassMember } from '../src/models/ClassMember.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'
import { seedSystemTests, systemTestContents } from '../scripts/seedSystem.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

test('seed:system adds every system test once, and a second run adds nothing', async () => {
  const first = await seedSystemTests()
  assert.equal(first.added.length, systemTestContents().length)

  const second = await seedSystemTests()
  assert.equal(second.added.length, 0)
  assert.equal(await Test.countDocuments({ isSystem: true, status: 'published' }), systemTestContents().length)
})

test('a new user sees the system tests with source=system, and not in their own library', async () => {
  await seedSystemTests()
  const { authHeader } = await createSignedInUser('newbie')

  const system = await request(app).get('/api/tests').query({ source: 'system', limit: 50 }).set('Authorization', authHeader)
  assert.equal(system.status, 200)
  assert.equal(system.body.total, systemTestContents().length)
  assert.ok(system.body.items.every((item) => item.isSystem === true))

  const mine = await request(app).get('/api/tests').set('Authorization', authHeader)
  assert.equal(mine.body.total, 0)
})

test('source=system keeps the other filters (skill)', async () => {
  await seedSystemTests()
  const { authHeader } = await createSignedInUser()

  const listening = await request(app).get('/api/tests').query({ source: 'system', skill: 'listening' }).set('Authorization', authHeader)
  assert.ok(listening.body.total > 0)
  assert.ok(listening.body.items.every((item) => item.skill === 'listening'))
})

test('any user can open and start a system test, but cannot edit it', async () => {
  await seedSystemTests()
  const { authHeader } = await createSignedInUser()
  const systemTest = await Test.findOne({ isSystem: true, kind: 'single', skill: 'reading' })

  const play = await request(app).get(`/api/tests/${systemTest.id}/play`).set('Authorization', authHeader)
  assert.equal(play.status, 200)

  const start = await request(app)
    .post('/api/attempts')
    .set('Authorization', authHeader)
    .send({ testId: systemTest.id, mode: { type: 'parts', sectionIndexes: [0], timeLimitMin: 20 } })
  assert.equal(start.status, 201)

  const edit = await request(app).get(`/api/tests/${systemTest.id}`).set('Authorization', authHeader)
  assert.equal(edit.status, 404)
})

test('a draft test of another user is still hidden', async () => {
  const { user: owner } = await createSignedInUser('owner')
  const { authHeader } = await createSignedInUser('other')
  const draft = await Test.create({ ownerId: owner._id, title: 'Private', skill: 'reading', kind: 'single', durationMin: 20 })

  const play = await request(app).get(`/api/tests/${draft.id}/play`).set('Authorization', authHeader)
  assert.equal(play.status, 404)
})

test('a teacher can put a system test into their class library', async () => {
  await seedSystemTests()
  const { user: teacher, authHeader } = await createSignedInUser('teacher')
  const myClass = await Class.create({ name: 'IELTS 6.5', code: 'ABC234', createdBy: teacher._id })
  await ClassMember.create({ classId: myClass._id, userId: teacher._id, role: 'teacher' })
  const systemTest = await Test.findOne({ isSystem: true })

  const response = await request(app)
    .post(`/api/classes/${myClass.id}/library`)
    .set('Authorization', authHeader)
    .send({ testIds: [systemTest.id] })
  assert.ok([200, 201].includes(response.status), `status ${response.status}`)
})
