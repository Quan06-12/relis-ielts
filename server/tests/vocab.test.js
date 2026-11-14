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

function createSet(user, body = { name: 'Environment' }) {
  return request(app).post('/api/vocab-sets').set('Authorization', user.authHeader).send(body)
}

function addWord(user, setId, body) {
  return request(app).post(`/api/vocab-sets/${setId}/words`).set('Authorization', user.authHeader).send(body)
}

test('US47: a set needs only a name and starts empty in purple', async () => {
  const user = await createSignedInUser()

  const created = await createSet(user)
  const missingName = await createSet(user, { name: ' ' })

  assert.equal(created.status, 201)
  assert.equal(created.body.set.name, 'Environment')
  assert.equal(created.body.set.color, 'purple')
  assert.equal(created.body.set.wordCount, 0)
  assert.equal(missingName.status, 400)
  assert.equal(missingName.body.error.code, 'VALIDATION_ERROR')
})

test('US47: the list shows my sets with a preview and the word count, not other people\'s sets', async () => {
  const user = await createSignedInUser('alice')
  const other = await createSignedInUser('bob')
  const set = (await createSet(user)).body.set
  await addWord(user, set.id, { type: 'adj', term: 'sustainable', meaning: 'bền vững' })
  await createSet(other, { name: 'Bob set' })

  const list = await request(app).get('/api/vocab-sets').set('Authorization', user.authHeader)
  const otherReads = await request(app).get(`/api/vocab-sets/${set.id}`).set('Authorization', other.authHeader)

  assert.equal(list.body.items.length, 1)
  assert.deepEqual(list.body.items[0].preview, ['sustainable'])
  assert.equal(list.body.items[0].wordCount, 1)
  assert.equal(otherReads.status, 404)
})

test('US48: adding the same word twice is refused with DUPLICATE_WORD', async () => {
  const user = await createSignedInUser()
  const set = (await createSet(user)).body.set

  const first = await addWord(user, set.id, { type: 'n', term: 'emission', meaning: 'khí thải' })
  const again = await addWord(user, set.id, { type: 'n', term: '  Emission ', meaning: 'sự thải ra' })
  const noMeaning = await addWord(user, set.id, { term: 'carbon' })

  assert.equal(first.status, 201)
  assert.equal(first.body.word.term, 'emission')
  assert.equal(again.status, 409)
  assert.equal(again.body.error.code, 'DUPLICATE_WORD')
  assert.equal(noMeaning.status, 400)
})

test('US48: editing and deleting a word', async () => {
  const user = await createSignedInUser()
  const set = (await createSet(user)).body.set
  const word = (await addWord(user, set.id, { type: 'v', term: 'mitigate', meaning: 'giảm nhẹ', verbForms: 'mitigated' })).body.word

  const edited = await request(app)
    .put(`/api/vocab-sets/${set.id}/words/${word.id}`)
    .set('Authorization', user.authHeader)
    .send({ type: 'n', term: 'mitigation', meaning: 'sự giảm nhẹ', verbForms: 'should be dropped' })
  const deleted = await request(app).delete(`/api/vocab-sets/${set.id}/words/${word.id}`).set('Authorization', user.authHeader)
  const after = await request(app).get(`/api/vocab-sets/${set.id}`).set('Authorization', user.authHeader)

  assert.equal(edited.status, 200)
  assert.equal(edited.body.word.term, 'mitigation')
  assert.equal(edited.body.word.verbForms, '')
  assert.equal(deleted.status, 204)
  assert.equal(after.body.set.words.length, 0)
})

test('US47: renaming and deleting a set', async () => {
  const user = await createSignedInUser()
  const set = (await createSet(user)).body.set

  const renamed = await request(app).patch(`/api/vocab-sets/${set.id}`).set('Authorization', user.authHeader).send({ name: 'Env 2', color: 'green' })
  const deleted = await request(app).delete(`/api/vocab-sets/${set.id}`).set('Authorization', user.authHeader)
  const gone = await request(app).get(`/api/vocab-sets/${set.id}`).set('Authorization', user.authHeader)

  assert.equal(renamed.body.set.name, 'Env 2')
  assert.equal(renamed.body.set.color, 'green')
  assert.equal(deleted.status, 204)
  assert.equal(gone.status, 404)
})
