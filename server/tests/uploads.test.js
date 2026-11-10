import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createToken } from '../src/utils/token.js'

process.env.JWT_SECRET ??= 'test-secret'

// Fake storage: remembers what it was asked to save instead of calling Cloudinary
const savedFiles = []
async function fakeSaveFile(file, kind) {
  savedFiles.push({ name: file.originalname, kind })
  return { url: `https://files.test/${kind}/${file.originalname}`, durationSec: kind === 'audio' ? 120 : null }
}

const app = createApp({ saveFile: fakeSaveFile, verifyGoogleCredential: async () => ({}) })
const authHeader = `Bearer ${createToken('6730a1f2c4e5d6b7a8091234')}`

test('US14: an mp3 is uploaded and its URL and length come back', async () => {
  const response = await request(app)
    .post('/api/uploads')
    .set('Authorization', authHeader)
    .field('kind', 'audio')
    .attach('file', Buffer.from('fake mp3'), { filename: 'part1.mp3', contentType: 'audio/mpeg' })

  assert.equal(response.status, 201)
  assert.deepEqual(response.body, { url: 'https://files.test/audio/part1.mp3', durationSec: 120 })
})

test('US12: a PDF is not accepted as a cover image', async () => {
  const response = await request(app)
    .post('/api/uploads')
    .set('Authorization', authHeader)
    .field('kind', 'image')
    .attach('file', Buffer.from('%PDF'), { filename: 'cover.pdf', contentType: 'application/pdf' })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
})

test('US12: an image above 2 MB returns 413 FILE_TOO_LARGE', async () => {
  const response = await request(app)
    .post('/api/uploads')
    .set('Authorization', authHeader)
    .field('kind', 'image')
    .attach('file', Buffer.alloc(3 * 1024 * 1024), { filename: 'big.png', contentType: 'image/png' })

  assert.equal(response.status, 413)
  assert.equal(response.body.error.code, 'FILE_TOO_LARGE')
})

test('uploading requires a signed-in user', async () => {
  const response = await request(app)
    .post('/api/uploads')
    .field('kind', 'image')
    .attach('file', Buffer.from('x'), { filename: 'a.png', contentType: 'image/png' })

  assert.equal(response.status, 401)
})
