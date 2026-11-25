import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { User } from '../src/models/User.js'
import { createLoginLimiter } from '../src/utils/loginLimiter.js'
import { hashPassword, verifyPassword } from '../src/utils/password.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential } from './helpers/auth.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

const lan = { name: 'Lan', email: 'Lan@Example.com', password: 'mat-khau-123' }

test('a password is stored only as a salted hash, and checked against it', async () => {
  const stored = await hashPassword('secret-123')
  assert.match(stored, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
  assert.notEqual(stored, await hashPassword('secret-123'), 'a new salt every time')
  assert.equal(await verifyPassword('secret-123', stored), true)
  assert.equal(await verifyPassword('secret-124', stored), false)
  assert.equal(await verifyPassword('anything', 'garbage'), false)
})

test('register creates an account, returns a token, and never sends the hash', async () => {
  const response = await request(app).post('/api/auth/register').send(lan)

  assert.equal(response.status, 201)
  assert.ok(response.body.token)
  assert.equal(response.body.user.email, 'lan@example.com', 'email is stored in lower case')
  assert.equal(response.body.user.passwordHash, undefined)

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${response.body.token}`)
  assert.equal(me.status, 200)
  assert.equal(me.body.user.passwordHash, undefined)

  const saved = await User.findOne({ email: 'lan@example.com' }).select('+passwordHash')
  assert.ok(saved.passwordHash.startsWith('scrypt$'))
  assert.equal(saved.googleId, undefined)
})

test('register checks name, email and password length, listing each field', async () => {
  const response = await request(app).post('/api/auth/register').send({ name: ' ', email: 'not-an-email', password: 'short' })

  assert.equal(response.status, 400)
  assert.deepEqual(response.body.error.details.map((detail) => detail.field), ['name', 'email', 'password'])
})

test('register with an email that already has an account is 409 EMAIL_TAKEN', async () => {
  await request(app).post('/api/auth/google').send({ credential: 'google:lan' })
  const response = await request(app).post('/api/auth/register').send({ ...lan, email: 'lan@gmail.com' })

  assert.equal(response.status, 409)
  assert.equal(response.body.error.code, 'EMAIL_TAKEN')
})

test('several password accounts can exist without a googleId', async () => {
  await request(app).post('/api/auth/register').send(lan)
  const second = await request(app).post('/api/auth/register').send({ ...lan, email: 'minh@example.com' })
  assert.equal(second.status, 201)
})

test('login with the right password works, whatever the case of the email', async () => {
  const registered = await request(app).post('/api/auth/register').send(lan)
  const response = await request(app).post('/api/auth/login').send({ email: 'LAN@example.com ', password: lan.password })

  assert.equal(response.status, 200)
  assert.equal(response.body.user.id, registered.body.user.id)
  assert.equal(response.body.user.passwordHash, undefined)
})

test('wrong password and unknown email give the same 401 INVALID_CREDENTIALS', async () => {
  await request(app).post('/api/auth/register').send(lan)
  const wrong = await request(app).post('/api/auth/login').send({ email: lan.email, password: 'wrong-password' })
  const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrong-password' })

  assert.equal(wrong.status, 401)
  assert.equal(wrong.body.error.code, 'INVALID_CREDENTIALS')
  assert.deepEqual(unknown.body, wrong.body)
})

test('a Google-only account cannot be opened with a password', async () => {
  await request(app).post('/api/auth/google').send({ credential: 'google:lan' })
  const response = await request(app).post('/api/auth/login').send({ email: 'lan@gmail.com', password: 'anything-123' })
  assert.equal(response.status, 401)
})

test('using Google with the email of a password account links it instead of failing', async () => {
  const registered = await request(app).post('/api/auth/register').send({ ...lan, email: 'lan@gmail.com' })
  const google = await request(app).post('/api/auth/google').send({ credential: 'google:lan' })

  assert.equal(google.status, 200)
  assert.equal(google.body.user.id, registered.body.user.id)

  // Both ways still open the same account
  const password = await request(app).post('/api/auth/login').send({ email: 'lan@gmail.com', password: lan.password })
  assert.equal(password.body.user.id, registered.body.user.id)
})

test('after 5 wrong passwords the email is blocked with 429 and Retry-After', async () => {
  const limitedApp = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })
  await request(limitedApp).post('/api/auth/register').send(lan)
  for (let i = 0; i < 5; i += 1) {
    await request(limitedApp).post('/api/auth/login').send({ email: lan.email, password: 'wrong-password' })
  }
  const blocked = await request(limitedApp).post('/api/auth/login').send({ email: lan.email, password: lan.password })

  assert.equal(blocked.status, 429)
  assert.equal(blocked.body.error.code, 'TOO_MANY_ATTEMPTS')
  assert.ok(Number(blocked.headers['retry-after']) > 0)
})

test('the login limiter forgets failures after its window and after a success', () => {
  let clock = 0
  const limiter = createLoginLimiter({ maxFailures: 2, windowMs: 1000, now: () => clock })
  limiter.recordFailure('a@x.com')
  limiter.recordFailure('a@x.com')
  assert.ok(limiter.retryAfterSec('a@x.com') > 0)
  clock = 1001
  assert.equal(limiter.retryAfterSec('a@x.com'), 0)

  limiter.recordFailure('a@x.com')
  limiter.reset('a@x.com')
  limiter.recordFailure('a@x.com')
  assert.equal(limiter.retryAfterSec('a@x.com'), 0)
})
