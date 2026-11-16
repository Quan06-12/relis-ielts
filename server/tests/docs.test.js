import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'

const app = createApp()

test('GET /api/docs serves the Swagger UI page', async () => {
  const response = await request(app).get('/api/docs')

  assert.equal(response.status, 200)
  assert.match(response.headers['content-type'], /text\/html/)
  assert.match(response.text, /SwaggerUIBundle/)
  assert.match(response.text, /url: 'docs\/openapi\.yaml'/)
})

test('GET /api/docs/ redirects to /api/docs so the relative spec URL still works', async () => {
  const response = await request(app).get('/api/docs/')

  assert.equal(response.status, 301)
  assert.equal(response.headers.location, '/api/docs')
})

test('GET /api/docs/openapi.yaml returns the contract from docs/api', async () => {
  const response = await request(app).get('/api/docs/openapi.yaml')

  assert.equal(response.status, 200)
  assert.match(response.headers['content-type'], /text\/yaml/)
  assert.match(response.text, /^openapi: 3\.1\.0/)
  assert.match(response.text, /relis-ielts-api\.onrender\.com/)
})
