import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readSetFields, readWordFields, isDuplicateTerm, toSetSummary } from '../src/utils/vocab.js'

test('readSetFields: the name is required; PATCH checks only what is sent', () => {
  assert.deepEqual(readSetFields({ name: '  Environment ' }).fields, { name: 'Environment' })
  assert.equal(readSetFields({ name: ' ' }).errors[0].field, 'name')
  assert.equal(readSetFields({ name: 'A', color: 'black' }).errors[0].field, 'color')
  assert.deepEqual(readSetFields({ color: 'green' }, { partial: true }), { fields: { color: 'green' }, errors: [] })
})

test('readWordFields: term and meaning are required, verb forms only for verbs', () => {
  const { errors } = readWordFields({ term: '', meaning: '' })
  assert.deepEqual(errors.map((error) => error.field), ['term', 'meaning'])

  const noun = readWordFields({ type: 'n', term: 'emission', meaning: 'khí thải', verbForms: 'x' }).fields
  assert.equal(noun.verbForms, '')
  const verb = readWordFields({ type: 'v', term: 'go', meaning: 'đi', verbForms: 'went – gone' }).fields
  assert.equal(verb.verbForms, 'went – gone')
  assert.equal(readWordFields({ type: 'weird', term: 'a', meaning: 'b' }).fields.type, 'other')
})

test('isDuplicateTerm ignores case and spaces, and the word being edited', () => {
  const words = [{ _id: 'w1', term: 'Run off' }]
  assert.equal(isDuplicateTerm(words, ' run   OFF '), true)
  assert.equal(isDuplicateTerm(words, 'run off', 'w1'), false)
  assert.equal(isDuplicateTerm(words, 'runoff'), false)
})

test('toSetSummary previews the first 4 words', () => {
  const set = { _id: 's1', name: 'Env', color: 'purple', coverUrl: null, updatedAt: null, words: ['a', 'b', 'c', 'd', 'e'].map((term) => ({ term })) }
  assert.deepEqual(toSetSummary(set).preview, ['a', 'b', 'c', 'd'])
  assert.equal(toSetSummary(set).wordCount, 5)
})
