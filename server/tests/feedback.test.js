import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { AppError } from '../src/errors/AppError.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'
import { sampleSections } from './helpers/sampleTest.js'

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

// A fake Gemini that remembers how often it was called and what it was asked
function fakeGemini() {
  const calls = []
  async function generateFeedback(prompt) {
    calls.push(prompt)
    return { summary: 'Làm tốt phần True/False.', weakTypes: ['Sentence/summary completion'], tips: ['Đọc kỹ giới hạn số từ.'], model: 'fake' }
  }
  return { generateFeedback, calls }
}

async function submittedAttempt(app, user) {
  const created = await request(app).post('/api/tests').set('Authorization', user.authHeader).send({ title: 'Rooftops', skill: 'reading', kind: 'full' })
  const testId = created.body.test.id
  await request(app).put(`/api/tests/${testId}`).set('Authorization', user.authHeader).send({ title: 'Rooftops', sections: sampleSections() })
  const started = await request(app).post('/api/attempts').set('Authorization', user.authHeader).send({ testId, mode: { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 } })
  return started.body.attempt.id
}

test('US49: feedback is made once, then the stored one is returned', async () => {
  const gemini = fakeGemini()
  const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential, generateFeedback: gemini.generateFeedback })
  const user = await createSignedInUser()
  const attemptId = await submittedAttempt(app, user)
  await request(app).post(`/api/attempts/${attemptId}/submit`).set('Authorization', user.authHeader)

  const first = await request(app).post(`/api/attempts/${attemptId}/feedback`).set('Authorization', user.authHeader)
  const second = await request(app).post(`/api/attempts/${attemptId}/feedback`).set('Authorization', user.authHeader)
  const review = await request(app).get(`/api/attempts/${attemptId}/review`).set('Authorization', user.authHeader)

  assert.equal(first.status, 201)
  assert.equal(first.body.feedback.summary, 'Làm tốt phần True/False.')
  assert.equal(second.status, 200)
  assert.equal(gemini.calls.length, 1)
  assert.match(gemini.calls[0], /correct/)
  assert.equal(review.body.attempt.feedback.tips[0], 'Đọc kỹ giới hạn số từ.')
})

test('US49: no feedback before submitting, and none for someone else’s attempt', async () => {
  const gemini = fakeGemini()
  const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential, generateFeedback: gemini.generateFeedback })
  const user = await createSignedInUser('alice')
  const stranger = await createSignedInUser('bob')
  const attemptId = await submittedAttempt(app, user)

  const tooEarly = await request(app).post(`/api/attempts/${attemptId}/feedback`).set('Authorization', user.authHeader)
  const notMine = await request(app).post(`/api/attempts/${attemptId}/feedback`).set('Authorization', stranger.authHeader)

  assert.equal(tooEarly.status, 409)
  assert.equal(notMine.status, 404)
  assert.equal(gemini.calls.length, 0)
})

test('US49: when Gemini fails the user gets 502 AI_FEEDBACK_FAILED and nothing is stored', async () => {
  const failing = async () => {
    throw new AppError(502, 'AI_FEEDBACK_FAILED', 'quota used up')
  }
  const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential, generateFeedback: failing })
  const user = await createSignedInUser()
  const attemptId = await submittedAttempt(app, user)
  await request(app).post(`/api/attempts/${attemptId}/submit`).set('Authorization', user.authHeader)

  const response = await request(app).post(`/api/attempts/${attemptId}/feedback`).set('Authorization', user.authHeader)
  const review = await request(app).get(`/api/attempts/${attemptId}/review`).set('Authorization', user.authHeader)

  assert.equal(response.status, 502)
  assert.equal(response.body.error.code, 'AI_FEEDBACK_FAILED')
  assert.equal(review.body.attempt.feedback, null)
})
