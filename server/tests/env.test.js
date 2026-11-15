import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseClientUrls } from '../src/config/env.js'

test('CLIENT_URL: one site stays a string, a comma list becomes an array', () => {
  assert.equal(parseClientUrls('https://relis.vn'), 'https://relis.vn')
  assert.deepEqual(parseClientUrls('https://relis.vn, https://relis-ielts.vercel.app/'), [
    'https://relis.vn',
    'https://relis-ielts.vercel.app',
  ])
  assert.equal(parseClientUrls(undefined), 'http://localhost:5173')
})
