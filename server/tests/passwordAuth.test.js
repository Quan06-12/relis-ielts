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

const lan = { username: 'Lan.Nguyen', password: 'mat-khau-123', name: 'Nguyễn Thị Lan' }

test('a password is stored only as a salted hash, and checked against it', async () => {
  const stored = await hashPassword('secret-123')
  assert.match(stored, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
  assert.notEqual(stored, await hashPassword('secret-123'), 'a new salt every time')
  assert.equal(await verifyPassword('secret-123', stored), true)
  assert.equal(await verifyPassword('secret-124', stored), false)
  assert.equal(await verifyPassword('anything', 'garbage'), false)
})

test('register creates an account with a username, returns a token, and never sends the hash', async () => {
  const response = await request(app).post('/api/auth/register').send(lan)

  assert.equal(response.status, 201)
  assert.ok(response.body.token)
  assert.equal(response.body.user.username, 'lan.nguyen', 'username is stored in lower case')
  assert.equal(response.body.user.name, 'Nguyễn Thị Lan')
  assert.equal(response.body.user.passwordHash, undefined)

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${response.body.token}`)
  assert.equal(me.status, 200)
  assert.equal(me.body.user.passwordHash, undefined)

  const saved = await User.findOne({ username: 'lan.nguyen' }).select('+passwordHash')
  assert.ok(saved.passwordHash.startsWith('scrypt$'))
  assert.equal(saved.email, undefined)
  assert.equal(saved.googleId, undefined)
})

test('without a display name, the username is shown as the name', async () => {
  const response = await request(app).post('/api/auth/register').send({ username: 'minh_99', password: 'mat-khau-123' })
  assert.equal(response.body.user.name, 'minh_99')
})

test('register checks the username and the password length, listing each field', async () => {
  const response = await request(app).post('/api/auth/register').send({ username: 'a b', password: 'short' })

  assert.equal(response.status, 400)
  assert.deepEqual(response.body.error.details.map((detail) => detail.field), ['username', 'password'])
})

test('a username with Vietnamese accents or under 3 characters is refused', async () => {
  for (const username of ['lân', 'ab', 'x'.repeat(31)]) {
    const response = await request(app).post('/api/auth/register').send({ username, password: 'mat-khau-123' })
    assert.equal(response.status, 400, username)
  }
})

test('a username that is taken (in any letter case) is 409 USERNAME_TAKEN', async () => {
  await request(app).post('/api/auth/register').send(lan)
  const response = await request(app).post('/api/auth/register').send({ ...lan, username: 'LAN.NGUYEN' })

  assert.equal(response.status, 409)
  assert.equal(response.body.error.code, 'USERNAME_TAKEN')
})

test('username accounts and Google accounts live side by side', async () => {
  await request(app).post('/api/auth/google').send({ credential: 'google:alice' })
  await request(app).post('/api/auth/register').send(lan)
  const second = await request(app).post('/api/auth/register').send({ username: 'minh', password: 'mat-khau-123' })
  assert.equal(second.status, 201)
  assert.equal(await User.countDocuments(), 3)
})

test('login with the right password works, whatever the case of the username', async () => {
  const registered = await request(app).post('/api/auth/register').send(lan)
  const response = await request(app).post('/api/auth/login').send({ username: ' LAN.nguyen ', password: lan.password })

  assert.equal(response.status, 200)
  assert.equal(response.body.user.id, registered.body.user.id)
  assert.equal(response.body.user.passwordHash, undefined)
})

test('wrong password and unknown username give the same 401 INVALID_CREDENTIALS', async () => {
  await request(app).post('/api/auth/register').send(lan)
  const wrong = await request(app).post('/api/auth/login').send({ username: lan.username, password: 'wrong-password' })
  const unknown = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'wrong-password' })

  assert.equal(wrong.status, 401)
  assert.equal(wrong.body.error.code, 'INVALID_CREDENTIALS')
  assert.deepEqual(unknown.body, wrong.body)
})

test('after 5 wrong passwords the username is blocked with 429 and Retry-After', async () => {
  const limitedApp = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })
  await request(limitedApp).post('/api/auth/register').send(lan)
  for (let i = 0; i < 5; i += 1) {
    await request(limitedApp).post('/api/auth/login').send({ username: lan.username, password: 'wrong-password' })
  }
  const blocked = await request(limitedApp).post('/api/auth/login').send({ username: lan.username, password: lan.password })

  assert.equal(blocked.status, 429)
  assert.equal(blocked.body.error.code, 'TOO_MANY_ATTEMPTS')
  assert.ok(Number(blocked.headers['retry-after']) > 0)
})

test('the login limiter forgets failures after its window and after a success', () => {
  let clock = 0
  const limiter = createLoginLimiter({ maxFailures: 2, windowMs: 1000, now: () => clock })
  limiter.recordFailure('lan')
  limiter.recordFailure('lan')
  assert.ok(limiter.retryAfterSec('lan') > 0)
  clock = 1001
  assert.equal(limiter.retryAfterSec('lan'), 0)

  limiter.recordFailure('lan')
  limiter.reset('lan')
  limiter.recordFailure('lan')
  assert.equal(limiter.retryAfterSec('lan'), 0)
})
