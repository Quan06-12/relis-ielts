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

test('US46: set target bands and exam date, then read them back', async () => {
  const { authHeader } = await createSignedInUser()

  const saved = await request(app).patch('/api/users/me').set('Authorization', authHeader).send({ goals: { reading: 7, listening: 7.5 }, examDate: '2026-12-20' })
  const me = await request(app).get('/api/auth/me').set('Authorization', authHeader)

  assert.equal(saved.status, 200)
  assert.equal(me.body.user.goals.reading, 7)
  assert.equal(me.body.user.goals.listening, 7.5)
  assert.equal(me.body.user.goals.overall, null)
  assert.equal(me.body.user.examDate.slice(0, 10), '2026-12-20')
})

test('US46: only the fields sent change; null clears one', async () => {
  const { authHeader } = await createSignedInUser()
  await request(app).patch('/api/users/me').set('Authorization', authHeader).send({ goals: { reading: 7, overall: 7 } })

  const response = await request(app).patch('/api/users/me').set('Authorization', authHeader).send({ goals: { reading: null } })

  assert.equal(response.body.user.goals.reading, null)
  assert.equal(response.body.user.goals.overall, 7)
})

test('US46: a band that is not a multiple of 0.5 is refused', async () => {
  const { authHeader } = await createSignedInUser()

  const response = await request(app).patch('/api/users/me').set('Authorization', authHeader).send({ goals: { reading: 6.3 } })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.details[0].field, 'goals.reading')
})
