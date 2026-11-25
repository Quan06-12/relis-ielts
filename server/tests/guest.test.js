import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { User } from '../src/models/User.js'
import { Test } from '../src/models/Test.js'
import { createRateLimit } from '../src/utils/rateLimit.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

async function signInAsGuest(onApp = app) {
  const response = await request(onApp).post('/api/auth/guest')
  return { response, authHeader: `Bearer ${response.body.token}` }
}

test('POST /auth/guest creates a guest user and returns a token', async () => {
  const { response, authHeader } = await signInAsGuest()

  assert.equal(response.status, 201)
  assert.equal(response.body.user.isGuest, true)
  assert.equal(response.body.user.name, 'Khách')

  const me = await request(app).get('/api/auth/me').set('Authorization', authHeader)
  assert.equal(me.status, 200)
  assert.equal(me.body.user.id, response.body.user.id)
})

test('several guests can exist at the same time (no googleId, no email)', async () => {
  await signInAsGuest()
  await signInAsGuest()
  await createSignedInUser('alice')
  assert.equal(await User.countDocuments({ isGuest: true }), 2)
})

test('a guest can create and take their own tests', async () => {
  const { authHeader } = await signInAsGuest()
  const created = await request(app).post('/api/tests').set('Authorization', authHeader).send({ title: 'Guest test', skill: 'reading', kind: 'single' })
  assert.equal(created.status, 201)

  const library = await request(app).get('/api/tests').set('Authorization', authHeader)
  assert.equal(library.body.total, 1)
})

test('a guest cannot create a class or join one: 403 GUEST_NOT_ALLOWED', async () => {
  const { authHeader } = await signInAsGuest()

  const create = await request(app).post('/api/classes').set('Authorization', authHeader).send({ name: 'IELTS 6.5' })
  assert.equal(create.status, 403)
  assert.equal(create.body.error.code, 'GUEST_NOT_ALLOWED')

  const join = await request(app).post('/api/classes/join').set('Authorization', authHeader).send({ code: 'ABC234' })
  assert.equal(join.status, 403)
  assert.equal(join.body.error.code, 'GUEST_NOT_ALLOWED')
})

test('a Google user can still create a class', async () => {
  const { authHeader } = await createSignedInUser('teacher')
  const create = await request(app).post('/api/classes').set('Authorization', authHeader).send({ name: 'IELTS 6.5' })
  assert.equal(create.status, 201)
})

test('a guest who signs in with Google keeps their tests and becomes a full account', async () => {
  const { response: guest, authHeader } = await signInAsGuest()
  await request(app).post('/api/tests').set('Authorization', authHeader).send({ title: 'Made as guest', skill: 'reading', kind: 'single' })

  const google = await request(app).post('/api/auth/google').set('Authorization', authHeader).send({ credential: 'google:lan' })

  assert.equal(google.status, 200)
  assert.equal(google.body.user.id, guest.body.user.id, 'same account')
  assert.equal(google.body.user.isGuest, false)
  assert.equal(google.body.user.email, 'lan@gmail.com')
  assert.equal(await Test.countDocuments({ ownerId: guest.body.user.id }), 1)

  const create = await request(app).post('/api/classes').set('Authorization', `Bearer ${google.body.token}`).send({ name: 'Now allowed' })
  assert.equal(create.status, 201)
})

test('a guest who signs in to a Google account that already exists opens that account', async () => {
  const existing = await request(app).post('/api/auth/google').send({ credential: 'google:lan' })
  const { authHeader } = await signInAsGuest()

  const google = await request(app).post('/api/auth/google').set('Authorization', authHeader).send({ credential: 'google:lan' })
  assert.equal(google.body.user.id, existing.body.user.id)
})

test('at most 10 guest accounts per address per hour: then 429 TOO_MANY_GUESTS', async () => {
  const limitedApp = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })
  for (let i = 0; i < 10; i += 1) {
    assert.equal((await signInAsGuest(limitedApp)).response.status, 201)
  }
  const blocked = await signInAsGuest(limitedApp)
  assert.equal(blocked.response.status, 429)
  assert.equal(blocked.response.body.error.code, 'TOO_MANY_GUESTS')
})

test('the rate limit starts again after its window', () => {
  let clock = 0
  const limit = createRateLimit({ max: 1, windowMs: 1000, now: () => clock })
  assert.equal(limit.allow('ip'), true)
  assert.equal(limit.allow('ip'), false)
  assert.equal(limit.allow('other-ip'), true)
  clock = 1001
  assert.equal(limit.allow('ip'), true)
})
