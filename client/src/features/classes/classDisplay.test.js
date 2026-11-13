import { test } from 'node:test'
import assert from 'node:assert/strict'
import { colorOf, formatScore, studentCountLabel } from './classDisplay.js'

test('an unknown colour falls back to purple', () => {
  assert.equal(colorOf('blue'), '#2563eb')
  assert.equal(colorOf('rainbow'), '#6b50e3')
})

test('a full test shows its band with one decimal', () => {
  assert.equal(formatScore({ band: 7, correct: 30, total: 40 }), '7.0')
})

test('parts practice shows correct/total, a missing test shows a dash', () => {
  assert.equal(formatScore({ band: null, correct: 9, total: 13 }), '9/13')
  assert.equal(formatScore(null), '—')
})

test('student count label', () => {
  assert.equal(studentCountLabel(3), '3 học viên')
  assert.equal(studentCountLabel(undefined), '0 học viên')
})
