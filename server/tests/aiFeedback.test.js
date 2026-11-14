import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createGeminiFeedback } from '../src/services/aiFeedback.js'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

// Replaces fetch with one that answers like Gemini, and remembers the request
function fakeFetch(status, body) {
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    return { ok: status === 200, status, json: async () => body }
  }
  return requests
}

test('without an API key the server answers AI_FEEDBACK_FAILED', async () => {
  const generate = createGeminiFeedback({ apiKey: '' })

  await assert.rejects(generate('prompt'), { code: 'AI_FEEDBACK_FAILED' })
})

test('the reply text is read as feedback; the key goes in a header, not the URL', async () => {
  const text = JSON.stringify({ summary: 'Ổn', weakTypes: [], tips: ['Luyện thêm'] })
  const requests = fakeFetch(200, { candidates: [{ content: { parts: [{ text }] } }] })
  const generate = createGeminiFeedback({ apiKey: 'test-key', model: 'gemini-test' })

  const feedback = await generate('prompt')

  assert.deepEqual(feedback, { summary: 'Ổn', weakTypes: [], tips: ['Luyện thêm'], model: 'gemini-test' })
  assert.match(requests[0].url, /models\/gemini-test:generateContent$/)
  assert.equal(requests[0].options.headers['x-goog-api-key'], 'test-key')
})

test('a quota error (429) or an unreadable reply becomes AI_FEEDBACK_FAILED', async () => {
  const generate = createGeminiFeedback({ apiKey: 'test-key' })

  fakeFetch(429, {})
  await assert.rejects(generate('prompt'), { code: 'AI_FEEDBACK_FAILED' })

  fakeFetch(200, { candidates: [{ content: { parts: [{ text: 'not json' }] } }] })
  await assert.rejects(generate('prompt'), { code: 'AI_FEEDBACK_FAILED' })
})
