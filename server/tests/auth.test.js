import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

test('US01: first Google sign-in creates the account and returns a token', async () => {
  const response = await request(app).post('/api/auth/google').send({ credential: 'google:alice' })

  assert.equal(response.status, 200)
  assert.ok(response.body.token)
  assert.equal(response.body.user.email, 'alice@gmail.com')
  assert.ok(response.body.user.id, 'uses id, not _id')
  assert.equal(response.body.user._id, undefined)
})

test('US01: signing in again reuses the same account', async () => {
  const first = await request(app).post('/api/auth/google').send({ credential: 'google:alice' })
  const second = await request(app).post('/api/auth/google').send({ credential: 'google:alice' })

  assert.equal(first.body.user.id, second.body.user.id)
})

test('US01: missing credential is a validation error', async () => {
  const response = await request(app).post('/api/auth/google').send({})

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
})

test('US01: a credential Google rejects returns 401 INVALID_GOOGLE_TOKEN', async () => {
  const response = await request(app).post('/api/auth/google').send({ credential: 'forged' })

  assert.equal(response.status, 401)
  assert.equal(response.body.error.code, 'INVALID_GOOGLE_TOKEN')
})

test('US02: /auth/me returns the user for a valid token', async () => {
  const { user, authHeader } = await createSignedInUser('bob')

  const response = await request(app).get('/api/auth/me').set('Authorization', authHeader)

  assert.equal(response.status, 200)
  assert.equal(response.body.user.id, user.id)
})

test('US02: /auth/me without a token or with a wrong token returns 401', async () => {
  const noToken = await request(app).get('/api/auth/me')
  const wrongToken = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nope')

  assert.equal(noToken.status, 401)
  assert.equal(wrongToken.status, 401)
  assert.equal(wrongToken.body.error.code, 'UNAUTHENTICATED')
})
