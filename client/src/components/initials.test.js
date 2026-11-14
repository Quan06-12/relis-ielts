import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialsOf } from './initials.js'

test('first and last word', () => {
  assert.equal(initialsOf('Minhquan Pham'), 'MP')
  assert.equal(initialsOf('Phạm Minh Quân'), 'PQ')
})

test('one word or nothing', () => {
  assert.equal(initialsOf('Quân'), 'QU')
  assert.equal(initialsOf('  '), '?')
})
