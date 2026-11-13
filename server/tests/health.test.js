import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'

const app = createApp()

test('GET /api/health returns ok', async () => {
  const response = await request(app).get('/api/health')

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { ok: true })
})

test('unknown route returns 404 in the shared error format', async () => {
  const response = await request(app).get('/api/does-not-exist')

  assert.equal(response.status, 404)
  assert.equal(response.body.error.code, 'NOT_FOUND')
})

test('invalid JSON body returns 400 INVALID_JSON', async () => {
  const response = await request(app)
    .post('/api/health')
    .set('Content-Type', 'application/json')
    .send('{ not json')

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'INVALID_JSON')
})
