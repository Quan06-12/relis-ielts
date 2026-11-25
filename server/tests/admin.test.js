import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Test } from '../src/models/Test.js'
import { User } from '../src/models/User.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'
import { createToken } from '../src/utils/token.js'
import { seedSystemTests } from '../scripts/seedSystem.js'
import { adminEmails, isAdminUser } from '../src/utils/admin.js'
import { dailySeries } from '../src/utils/adminStats.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(async () => {
  process.env.ADMIN_EMAILS = ' Boss@gmail.com , other-admin@gmail.com'
  await startTestDatabase()
})
beforeEach(clearTestDatabase)
after(async () => {
  delete process.env.ADMIN_EMAILS
  await stopTestDatabase()
})

test('ADMIN_EMAILS is read case-insensitively, and a guest is never an admin', () => {
  const emails = adminEmails(' A@x.com,, b@y.com ')
  assert.deepEqual([...emails], ['a@x.com', 'b@y.com'])
  assert.equal(isAdminUser({ email: 'A@X.COM', isGuest: false }, emails), true)
  assert.equal(isAdminUser({ email: 'a@x.com', isGuest: true }, emails), false)
  assert.equal(isAdminUser({ email: 'c@z.com', isGuest: false }, emails), false)
  assert.equal(isAdminUser(null, emails), false)
})

test('GET /auth/me says whether the user is an admin', async () => {
  const { authHeader: bossHeader } = await createSignedInUser('boss')
  const { authHeader: userHeader } = await createSignedInUser('alice')

  const boss = await request(app).get('/api/auth/me').set('Authorization', bossHeader)
  const alice = await request(app).get('/api/auth/me').set('Authorization', userHeader)
  assert.equal(boss.body.user.isAdmin, true)
  assert.equal(alice.body.user.isAdmin, false)
})

test('only an admin gets the statistics (403 ADMIN_ONLY otherwise)', async () => {
  await seedSystemTests()
  const { authHeader: bossHeader } = await createSignedInUser('boss')
  const { authHeader: userHeader } = await createSignedInUser('alice')
  const guest = await User.create({ name: 'Khách', isGuest: true })

  const refused = await request(app).get('/api/admin/stats').set('Authorization', userHeader)
  assert.equal(refused.status, 403)
  assert.equal(refused.body.error.code, 'ADMIN_ONLY')

  const stats = await request(app).get('/api/admin/stats').set('Authorization', bossHeader)
  assert.equal(stats.status, 200)
  assert.deepEqual(stats.body.users, { total: 3, google: 2, guests: 1 }) // the Relis account is not counted
  assert.equal(stats.body.tests.system, 15)
  assert.equal(stats.body.daily.length, 30)
  assert.equal(stats.body.daily.at(-1).newUsers, 3)
  assert.ok(guest)
})

test('an admin creates a system test; it stays a draft that only admins see until published', async () => {
  const { authHeader: bossHeader } = await createSignedInUser('boss')
  const { authHeader: userHeader } = await createSignedInUser('alice')

  const refused = await request(app).post('/api/tests').set('Authorization', userHeader).send({ title: 'X', skill: 'reading', kind: 'single', system: true })
  assert.equal(refused.status, 403)

  const created = await request(app).post('/api/tests').set('Authorization', bossHeader).send({ title: 'New Relis test', skill: 'reading', kind: 'single', system: true })
  assert.equal(created.status, 201)
  const saved = await Test.findById(created.body.test.id).populate('ownerId')
  assert.equal(saved.isSystem, true)
  assert.equal(saved.ownerId.name, 'Relis')

  const adminList = await request(app).get('/api/tests').query({ source: 'system' }).set('Authorization', bossHeader)
  const userList = await request(app).get('/api/tests').query({ source: 'system' }).set('Authorization', userHeader)
  assert.equal(adminList.body.total, 1)
  assert.equal(userList.body.total, 0)

  // Not in the admin's own library
  const mine = await request(app).get('/api/tests').set('Authorization', bossHeader)
  assert.equal(mine.body.total, 0)
})

test('an admin can edit and hide a system test; a normal user cannot', async () => {
  await seedSystemTests()
  const { authHeader: bossHeader } = await createSignedInUser('boss')
  const { authHeader: userHeader } = await createSignedInUser('alice')
  const systemTest = await Test.findOne({ isSystem: true, kind: 'single', skill: 'reading' })

  assert.equal((await request(app).get(`/api/tests/${systemTest.id}`).set('Authorization', userHeader)).status, 404)
  assert.equal((await request(app).delete(`/api/tests/${systemTest.id}`).set('Authorization', userHeader)).status, 404)

  const opened = await request(app).get(`/api/tests/${systemTest.id}`).set('Authorization', bossHeader)
  assert.equal(opened.status, 200)
  const body = { ...opened.body.test, title: 'Renamed by admin' }
  const saved = await request(app).put(`/api/tests/${systemTest.id}`).set('Authorization', bossHeader).send(body)
  assert.equal(saved.status, 200)
  assert.equal(saved.body.test.title, 'Renamed by admin')

  const removed = await request(app).delete(`/api/tests/${systemTest.id}`).set('Authorization', bossHeader)
  assert.equal(removed.status, 204)
  const list = await request(app).get('/api/tests').query({ source: 'system', limit: 50 }).set('Authorization', userHeader)
  assert.equal(list.body.total, 14)
})

test('removing an email from ADMIN_EMAILS takes the role away at once', async () => {
  const { user } = await createSignedInUser('boss')
  const header = `Bearer ${createToken(user.id)}`
  process.env.ADMIN_EMAILS = 'someone-else@gmail.com'
  try {
    const refused = await request(app).get('/api/admin/stats').set('Authorization', header)
    assert.equal(refused.status, 403)
  } finally {
    process.env.ADMIN_EMAILS = 'boss@gmail.com'
  }
})

test('dailySeries counts per local day and ignores days outside the window', () => {
  const today = new Date('2026-11-25T05:00:00Z') // 12:00 in Vietnam
  const series = dailySeries(
    [{ createdAt: new Date('2026-11-24T18:30:00Z') }, { createdAt: new Date('2026-10-01T00:00:00Z') }], // 01:30 on the 25th; far outside
    [{ submittedAt: new Date('2026-11-24T16:59:00Z') }, { submittedAt: new Date('2026-11-24T17:01:00Z') }], // 23:59 on the 24th; 00:01 on the 25th
    today,
    3
  )
  assert.deepEqual(series, [
    { date: '2026-11-23', newUsers: 0, attempts: 0 },
    { date: '2026-11-24', newUsers: 0, attempts: 1 },
    { date: '2026-11-25', newUsers: 1, attempts: 1 },
  ])
})
